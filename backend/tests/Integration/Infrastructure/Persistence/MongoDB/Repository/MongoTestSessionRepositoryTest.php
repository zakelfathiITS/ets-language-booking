<?php

declare(strict_types=1);

namespace App\Tests\Integration\Infrastructure\Persistence\MongoDB\Repository;

use App\Domain\Catalog\Capacity;
use App\Domain\Catalog\Exception\CapacityBelowReservedSeats;
use App\Domain\Catalog\Exception\SessionHasReservations;
use App\Domain\Catalog\SessionCriteria;
use App\Domain\Catalog\TestSession;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Shared\Pagination\PageRequest;
use App\Infrastructure\Persistence\MongoDB\Repository\MongoTestSessionRepository;
use App\Tests\Support\CatalogFixtures;
use App\Tests\Support\ResetsDatabase;
use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectId;
use MongoDB\Driver\Monitoring\CommandFailedEvent;
use MongoDB\Driver\Monitoring\CommandStartedEvent;
use MongoDB\Driver\Monitoring\CommandSubscriber;
use MongoDB\Driver\Monitoring\CommandSucceededEvent;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

use function MongoDB\Driver\Monitoring\addSubscriber;
use function MongoDB\Driver\Monitoring\removeSubscriber;

#[CoversClass(MongoTestSessionRepository::class)]
final class MongoTestSessionRepositoryTest extends KernelTestCase
{
    use CatalogFixtures;
    use ResetsDatabase;

    private MongoTestSessionRepository $repository;
    private DocumentManager $documentManager;

    protected function setUp(): void
    {
        self::bootKernel();
        self::resetDatabase();

        $this->documentManager = self::getContainer()->get(DocumentManager::class);
        $this->repository = new MongoTestSessionRepository($this->documentManager);
    }

    public function testASessionSurvivesARoundTripWithTheExpectedFieldNames(): void
    {
        $session = TestSession::schedule(
            $this->repository->nextIdentity(),
            'English',
            new \DateTimeImmutable('+5 days 09:00', new \DateTimeZone('UTC')),
            'Paris',
            Capacity::of(12),
            new \DateTimeImmutable(),
        );
        $this->repository->save($session);
        $this->documentManager->clear();

        $loaded = $this->repository->ofId($session->id());
        self::assertNotNull($loaded);
        self::assertSame('English', $loaded->language());
        self::assertSame(12, $loaded->capacity()->seats);
        self::assertSame(0, $loaded->seatsTaken());
        self::assertEquals($session->scheduledAt(), $loaded->scheduledAt());

        $raw = $this->documentManager->getDocumentCollection(TestSession::class)->findOne();
        self::assertIsArray($raw);
        self::assertEqualsCanonicalizing(
            ['_id', 'language', 'scheduled_at', 'location', 'capacity', 'seats_taken', 'created_at', 'updated_at'],
            array_keys($raw),
        );
    }

    public function testTheIndexesTargetTheStoredFieldNames(): void
    {
        $indexes = [];
        foreach ($this->documentManager->getDocumentCollection(TestSession::class)->listIndexes() as $index) {
            $indexes[$index->getName()] = $index->getKey();
        }

        self::assertSame(['scheduled_at' => 1, '_id' => 1], $indexes['idx_sessions_scheduled_at_id'] ?? null);
        self::assertSame(['language' => 1, 'scheduled_at' => 1, '_id' => 1], $indexes['idx_sessions_language_scheduled_at_id'] ?? null);
    }

    /**
     * @return iterable<string, array{SessionCriteria, string}>
     */
    public static function listings(): iterable
    {
        yield 'upcoming sessions' => [new SessionCriteria(startsAfter: new \DateTimeImmutable()), 'idx_sessions_scheduled_at_id'];
        yield 'one language' => [new SessionCriteria(language: 'English', startsAfter: new \DateTimeImmutable()), 'idx_sessions_language_scheduled_at_id'];
        yield 'with seats left' => [new SessionCriteria(startsAfter: new \DateTimeImmutable(), availableOnly: true), 'idx_sessions_scheduled_at_id'];
    }

    #[DataProvider('listings')]
    public function testAPageIsReadInIndexOrderWithoutSortingInMemory(SessionCriteria $criteria, string $expectedIndex): void
    {
        $this->createSession('English');
        $this->createSession('French');

        // The exact command the repository sends, explained by MongoDB.
        $find = $this->captureFindCommand(fn () => $this->repository->search($criteria, PageRequest::of(2, 5)));
        $explained = $this->documentManager->getDocumentDatabase(TestSession::class)
            ->command(['explain' => $find, 'verbosity' => 'queryPlanner'], ['typeMap' => ['root' => 'array', 'document' => 'array', 'array' => 'array']])
            ->toArray()[0];
        $stages = self::stagesOf($explained['queryPlanner']['winningPlan']['queryPlan'] ?? $explained['queryPlanner']['winningPlan']);

        self::assertContains('IXSCAN '.$expectedIndex, $stages);
        self::assertNotContains('SORT', $stages, 'No in-memory sort: '.implode(' <- ', $stages));
    }

    public function testTheCapacityCannotDropBelowSeatsBookedInTheMeantime(): void
    {
        $id = $this->createSession(capacity: 4);
        $session = $this->repository->ofId(TestSessionId::fromString($id));
        self::assertNotNull($session);
        $this->bookBehindTheRepositorysBack($id, seats: 3);

        // Checked against the 0 seats it knows of, the aggregate accepts 2...
        $session->reschedule($session->language(), $session->scheduledAt(), $session->location(), Capacity::of(2), new \DateTimeImmutable());

        try {
            $this->repository->save($session);
            self::fail('The capacity must not drop below the 3 seats booked meanwhile.');
        } catch (CapacityBelowReservedSeats) {
        }

        $this->documentManager->clear();
        self::assertSame(4, $this->repository->ofId(TestSessionId::fromString($id))?->capacity()->seats);
    }

    public function testTheCapacityCanDropToTheSeatsBooked(): void
    {
        $id = $this->createSession(capacity: 4);
        $session = $this->repository->ofId(TestSessionId::fromString($id));
        self::assertNotNull($session);
        $this->bookBehindTheRepositorysBack($id, seats: 2);

        $session->reschedule($session->language(), $session->scheduledAt(), $session->location(), Capacity::of(2), new \DateTimeImmutable());
        $this->repository->save($session);

        $this->documentManager->clear();
        $stored = $this->repository->ofId(TestSessionId::fromString($id));
        self::assertSame(2, $stored?->capacity()->seats);
        self::assertSame(2, $stored->seatsTaken(), 'The seat counter is never overwritten.');
    }

    public function testASessionBookedInTheMeantimeIsNotDeleted(): void
    {
        $id = $this->createSession();
        $session = $this->repository->ofId(TestSessionId::fromString($id));
        self::assertNotNull($session);
        $session->ensureCanBeDeleted(); // no seat taken, as far as the aggregate knows
        $this->bookBehindTheRepositorysBack($id, seats: 1);

        try {
            $this->repository->remove($session);
            self::fail('A session with a seat taken must not be deleted.');
        } catch (SessionHasReservations) {
        }

        $this->documentManager->clear();
        self::assertNotNull($this->repository->ofId(TestSessionId::fromString($id)));
    }

    public function testSearchCombinesFiltersSortsAndPaginates(): void
    {
        $this->createSession('English', '+3 days');
        $this->createSession('English', '+1 day');
        $full = $this->createSession('English', '+2 days', capacity: 5);
        $this->createSession('French', '+4 days');
        $past = $this->createSession('English', '+6 days');
        $this->setSeatsTaken($full, 5);
        $this->moveToThePast($past);

        $criteria = new SessionCriteria(language: 'English', startsAfter: new \DateTimeImmutable(), availableOnly: true);
        $first = $this->repository->search($criteria, PageRequest::of(1, 1));
        $second = $this->repository->search($criteria, PageRequest::of(2, 1));

        self::assertSame(2, $first->total);
        self::assertCount(1, $first->items);
        self::assertTrue($first->items[0]->scheduledAt() < $second->items[0]->scheduledAt(), 'Soonest first.');
        self::assertNotSame($first->items[0]->id()->value, $second->items[0]->id()->value);
    }

    public function testSearchWithoutCriteriaReturnsEverything(): void
    {
        $this->createSession('English');
        $this->moveToThePast($this->createSession('French'));

        self::assertSame(2, $this->repository->search(new SessionCriteria(), PageRequest::of(1, 10))->total);
    }

    public function testItListsDistinctLanguagesOfUpcomingSessions(): void
    {
        $this->createSession('Spanish');
        $this->createSession('English');
        $this->createSession('English', '+20 days');
        $this->moveToThePast($this->createSession('German'));

        self::assertSame(['English', 'Spanish'], $this->repository->languagesOfSessionsStartingAfter(new \DateTimeImmutable()));
    }

    public function testItRemovesASession(): void
    {
        $id = TestSessionId::fromString($this->createSession());
        $session = $this->repository->ofId($id);
        self::assertNotNull($session);

        $this->repository->remove($session);

        self::assertNull($this->repository->ofId($id));
    }

    /**
     * A concurrent booking, as another request would make it: the session
     * already loaded here is left unaware of it.
     */
    private function bookBehindTheRepositorysBack(string $sessionId, int $seats): void
    {
        $this->documentManager->getDocumentCollection(TestSession::class)
            ->updateOne(['_id' => new ObjectId($sessionId)], ['$inc' => ['seats_taken' => $seats]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function captureFindCommand(callable $action): array
    {
        $subscriber = new class implements CommandSubscriber {
            /** @var array<string, mixed>|null */
            public ?array $find = null;

            public function commandStarted(CommandStartedEvent $event): void
            {
                if ($event->getCommandName() === 'find') {
                    $this->find = (array) $event->getCommand();
                }
            }

            public function commandSucceeded(CommandSucceededEvent $event): void
            {
            }

            public function commandFailed(CommandFailedEvent $event): void
            {
            }
        };

        addSubscriber($subscriber);
        try {
            $action();
        } finally {
            removeSubscriber($subscriber);
        }

        self::assertNotNull($subscriber->find);
        unset($subscriber->find['$db'], $subscriber->find['lsid'], $subscriber->find['$clusterTime']);

        return $subscriber->find;
    }

    /**
     * @param array<string, mixed> $plan
     *
     * @return list<string> stage names, from the root down, with their index
     */
    private static function stagesOf(array $plan): array
    {
        $stage = (string) $plan['stage'].(isset($plan['indexName']) ? ' '.$plan['indexName'] : '');
        $children = isset($plan['inputStage']) ? [$plan['inputStage']] : ($plan['inputStages'] ?? []);

        return array_merge([$stage], ...array_map(self::stagesOf(...), $children));
    }

    public function testAMalformedIdMatchesNoSession(): void
    {
        self::assertNull($this->repository->ofId(TestSessionId::fromString('languages')));
    }
}
