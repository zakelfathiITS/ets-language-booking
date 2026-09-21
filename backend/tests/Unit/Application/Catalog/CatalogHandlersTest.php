<?php

declare(strict_types=1);

namespace App\Tests\Unit\Application\Catalog;

use App\Application\Catalog\CreateTestSession\CreateTestSessionCommand;
use App\Application\Catalog\CreateTestSession\CreateTestSessionHandler;
use App\Application\Catalog\DeleteTestSession\DeleteTestSessionCommand;
use App\Application\Catalog\DeleteTestSession\DeleteTestSessionHandler;
use App\Application\Catalog\GetTestSession\GetTestSessionHandler;
use App\Application\Catalog\GetTestSession\GetTestSessionQuery;
use App\Application\Catalog\ListLanguages\ListLanguagesHandler;
use App\Application\Catalog\ListTestSessions\ListTestSessionsHandler;
use App\Application\Catalog\ListTestSessions\ListTestSessionsQuery;
use App\Application\Catalog\TestSessionView;
use App\Application\Catalog\UpdateTestSession\UpdateTestSessionCommand;
use App\Application\Catalog\UpdateTestSession\UpdateTestSessionHandler;
use App\Domain\Catalog\Exception\SessionHasReservations;
use App\Domain\Catalog\Exception\TestSessionNotFound;
use App\Domain\Catalog\TestSessionId;
use App\Tests\Support\FrozenClock;
use App\Tests\Support\InMemory\InMemoryTestSessionRepository;
use App\Tests\Support\TestSessionState;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(CreateTestSessionHandler::class)]
#[CoversClass(UpdateTestSessionHandler::class)]
#[CoversClass(DeleteTestSessionHandler::class)]
#[CoversClass(GetTestSessionHandler::class)]
#[CoversClass(ListTestSessionsHandler::class)]
#[CoversClass(ListLanguagesHandler::class)]
#[CoversClass(TestSessionView::class)]
#[CoversClass(TestSessionNotFound::class)]
final class CatalogHandlersTest extends TestCase
{
    private InMemoryTestSessionRepository $sessions;
    private FrozenClock $clock;

    protected function setUp(): void
    {
        $this->sessions = new InMemoryTestSessionRepository();
        $this->clock = new FrozenClock('2026-03-01 12:00:00');
    }

    public function testItCreatesASession(): void
    {
        $view = $this->create('english', '2026-03-10 09:00:00', capacity: 15);

        self::assertSame('English', $view->language);
        self::assertSame(15, $view->capacity);
        self::assertSame(15, $view->seatsAvailable);
        self::assertFalse($view->hasStarted);
        self::assertNotNull($this->sessions->ofId(TestSessionId::fromString($view->id)));
    }

    public function testItUpdatesASession(): void
    {
        $id = $this->create('English', '2026-03-10 09:00:00')->id;

        $view = (new UpdateTestSessionHandler($this->sessions, $this->clock))(
            new UpdateTestSessionCommand($id, 'German', new \DateTimeImmutable('2026-03-20 14:00:00'), 'Berlin', 25),
        );

        self::assertSame('German', $view->language);
        self::assertSame('Berlin', $view->location);
        self::assertSame(25, $view->capacity);
    }

    public function testUpdatingAnUnknownSessionFails(): void
    {
        $this->expectException(TestSessionNotFound::class);

        (new UpdateTestSessionHandler($this->sessions, $this->clock))(
            new UpdateTestSessionCommand('ffffffffffffffffffffffff', 'German', new \DateTimeImmutable('2026-03-20 14:00:00'), 'Berlin', 25),
        );
    }

    public function testItDeletesASessionWithoutBookings(): void
    {
        $id = $this->create('English', '2026-03-10 09:00:00')->id;

        (new DeleteTestSessionHandler($this->sessions))(new DeleteTestSessionCommand($id));

        self::assertNull($this->sessions->ofId(TestSessionId::fromString($id)));
    }

    public function testItRefusesToDeleteASessionWithBookings(): void
    {
        $id = $this->create('English', '2026-03-10 09:00:00')->id;
        $session = $this->sessions->ofId(TestSessionId::fromString($id));
        self::assertNotNull($session);
        TestSessionState::withSeatsTaken($session, 2);

        $this->expectException(SessionHasReservations::class);

        (new DeleteTestSessionHandler($this->sessions))(new DeleteTestSessionCommand($id));
    }

    public function testItReturnsASessionOrReportsItMissing(): void
    {
        $id = $this->create('English', '2026-03-10 09:00:00')->id;
        $get = new GetTestSessionHandler($this->sessions, $this->clock);

        self::assertSame($id, $get(new GetTestSessionQuery($id))->id);

        $this->expectException(TestSessionNotFound::class);
        $get(new GetTestSessionQuery('ffffffffffffffffffffffff'));
    }

    public function testListingShowsUpcomingSessionsSoonestFirstAndPaginates(): void
    {
        $this->create('English', '2026-03-12 09:00:00');
        $this->create('French', '2026-03-10 09:00:00');
        $this->create('Spanish', '2026-03-11 09:00:00');
        $this->clock->travelTo('2026-03-10 10:00:00'); // the French session has started

        $page = $this->list(new ListTestSessionsQuery(page: 1, limit: 1));

        self::assertSame(2, $page->total);
        self::assertSame(2, $page->totalPages());
        self::assertSame(['Spanish'], array_map(static fn (TestSessionView $view): string => $view->language, $page->items));
    }

    public function testListingCanIncludePastSessions(): void
    {
        $this->create('French', '2026-03-10 09:00:00');
        $this->clock->travelTo('2026-03-11 00:00:00');

        self::assertSame(0, $this->list(new ListTestSessionsQuery())->total);
        $page = $this->list(new ListTestSessionsQuery(includePast: true));
        self::assertSame(1, $page->total);
        self::assertTrue($page->items[0]->hasStarted);
    }

    public function testListingFiltersByLanguageWhateverItsCase(): void
    {
        $this->create('English', '2026-03-10 09:00:00');
        $this->create('French', '2026-03-11 09:00:00');

        $page = $this->list(new ListTestSessionsQuery(language: ' FRENCH '));

        self::assertSame(1, $page->total);
        self::assertSame('French', $page->items[0]->language);
    }

    public function testListingCanHideFullSessions(): void
    {
        $fullId = $this->create('English', '2026-03-10 09:00:00', capacity: 2)->id;
        $this->create('French', '2026-03-11 09:00:00');
        $full = $this->sessions->ofId(TestSessionId::fromString($fullId));
        self::assertNotNull($full);
        TestSessionState::withSeatsTaken($full, 2);

        $page = $this->list(new ListTestSessionsQuery(availableOnly: true));

        self::assertSame(['French'], array_map(static fn (TestSessionView $view): string => $view->language, $page->items));
    }

    public function testItListsTheLanguagesOfUpcomingSessions(): void
    {
        $this->create('Spanish', '2026-03-12 09:00:00');
        $this->create('English', '2026-03-10 09:00:00');
        $this->create('english', '2026-03-11 09:00:00');

        self::assertSame(['English', 'Spanish'], (new ListLanguagesHandler($this->sessions, $this->clock))());
    }

    private function create(string $language, string $scheduledAt, int $capacity = 20): TestSessionView
    {
        return (new CreateTestSessionHandler($this->sessions, $this->clock))(
            new CreateTestSessionCommand($language, new \DateTimeImmutable($scheduledAt), 'Paris', $capacity),
        );
    }

    /**
     * @return \App\Domain\Shared\Pagination\Page<TestSessionView>
     */
    private function list(ListTestSessionsQuery $query): \App\Domain\Shared\Pagination\Page
    {
        return (new ListTestSessionsHandler($this->sessions, $this->clock))($query);
    }
}
