<?php

declare(strict_types=1);

namespace App\Tests\Integration\Infrastructure\Persistence\MongoDB\Repository;

use App\Domain\Catalog\Capacity;
use App\Domain\Catalog\SessionCriteria;
use App\Domain\Catalog\TestSession;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Shared\Pagination\PageRequest;
use App\Infrastructure\Persistence\MongoDB\Repository\MongoTestSessionRepository;
use App\Tests\Support\CatalogFixtures;
use App\Tests\Support\ResetsDatabase;
use Doctrine\ODM\MongoDB\DocumentManager;
use PHPUnit\Framework\Attributes\CoversClass;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

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

        self::assertSame(['scheduled_at' => 1], $indexes['idx_sessions_scheduled_at'] ?? null);
        self::assertSame(['language' => 1, 'scheduled_at' => 1], $indexes['idx_sessions_language_scheduled_at'] ?? null);
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

    public function testAMalformedIdMatchesNoSession(): void
    {
        self::assertNull($this->repository->ofId(TestSessionId::fromString('languages')));
    }
}
