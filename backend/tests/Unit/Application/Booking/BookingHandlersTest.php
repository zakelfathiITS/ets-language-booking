<?php

declare(strict_types=1);

namespace App\Tests\Unit\Application\Booking;

use App\Application\Booking\BookSession\BookSessionCommand;
use App\Application\Booking\BookSession\BookSessionHandler;
use App\Application\Booking\CancelReservation\CancelReservationCommand;
use App\Application\Booking\CancelReservation\CancelReservationHandler;
use App\Application\Booking\GetReservation\GetReservationHandler;
use App\Application\Booking\GetReservation\GetReservationQuery;
use App\Application\Booking\ListReservedSessions\ListReservedSessionsHandler;
use App\Application\Booking\ListReservedSessions\ListReservedSessionsQuery;
use App\Application\Booking\ListUserReservations\ListUserReservationsHandler;
use App\Application\Booking\ListUserReservations\ListUserReservationsQuery;
use App\Application\Booking\ReservationView;
use App\Application\Catalog\CreateTestSession\CreateTestSessionCommand;
use App\Application\Catalog\CreateTestSession\CreateTestSessionHandler;
use App\Domain\Booking\Exception\AlreadyReserved;
use App\Domain\Booking\Exception\ReservationNotFound;
use App\Domain\Booking\Reservation;
use App\Domain\Booking\ReservationId;
use App\Domain\Booking\ReservationRepository;
use App\Domain\Catalog\Exception\SessionAlreadyStarted;
use App\Domain\Catalog\Exception\SessionFull;
use App\Domain\Catalog\Exception\TestSessionNotFound;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Identity\UserId;
use App\Tests\Support\FrozenClock;
use App\Tests\Support\InMemory\InMemoryReservationRepository;
use App\Tests\Support\InMemory\InMemorySeatAllocator;
use App\Tests\Support\InMemory\InMemoryTestSessionRepository;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(BookSessionHandler::class)]
#[CoversClass(CancelReservationHandler::class)]
#[CoversClass(GetReservationHandler::class)]
#[CoversClass(ListUserReservationsHandler::class)]
#[CoversClass(ListReservedSessionsHandler::class)]
#[CoversClass(ReservationView::class)]
#[CoversClass(AlreadyReserved::class)]
#[CoversClass(ReservationNotFound::class)]
final class BookingHandlersTest extends TestCase
{
    private const JANE = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    private const JOHN = 'bbbbbbbbbbbbbbbbbbbbbbbb';

    private InMemoryTestSessionRepository $sessions;
    private InMemoryReservationRepository $reservations;
    private InMemorySeatAllocator $seats;
    private FrozenClock $clock;

    protected function setUp(): void
    {
        $this->sessions = new InMemoryTestSessionRepository();
        $this->reservations = new InMemoryReservationRepository();
        $this->seats = new InMemorySeatAllocator($this->sessions);
        $this->clock = new FrozenClock('2026-03-01 12:00:00');
    }

    public function testBookingTakesASeatAndRecordsTheReservation(): void
    {
        $sessionId = $this->createSession(capacity: 3);

        $view = $this->book(self::JANE, $sessionId);

        self::assertSame(1, $view->session->seatsTaken);
        self::assertSame(2, $view->session->seatsAvailable);
        self::assertTrue($view->canBeCancelled);
        self::assertNotNull($this->reservations->ofUserAndSession(UserId::fromString(self::JANE), TestSessionId::fromString($sessionId)));
    }

    public function testBookingAnUnknownSessionFails(): void
    {
        $this->expectException(TestSessionNotFound::class);

        $this->book(self::JANE, 'ffffffffffffffffffffffff');
    }

    public function testASessionCanOnlyBeBookedOncePerUserWithoutConsumingASeat(): void
    {
        $sessionId = $this->createSession(capacity: 3);
        $this->book(self::JANE, $sessionId);

        try {
            $this->book(self::JANE, $sessionId);
            self::fail('A second booking was accepted.');
        } catch (AlreadyReserved) {
        }

        self::assertSame(1, $this->seatsTaken($sessionId));
    }

    public function testTheLastSeatGoesToTheFirstCandidate(): void
    {
        $sessionId = $this->createSession(capacity: 1);
        $this->book(self::JANE, $sessionId);

        $this->expectException(SessionFull::class);

        $this->book(self::JOHN, $sessionId);
    }

    public function testASessionThatHasStartedCannotBeBooked(): void
    {
        $sessionId = $this->createSession(scheduledAt: '2026-03-02 09:00:00');
        $this->clock->travelTo('2026-03-02 09:30:00');

        $this->expectException(SessionAlreadyStarted::class);

        $this->book(self::JANE, $sessionId);
    }

    public function testTheSeatIsGivenBackWhenTheReservationCannotBeRecorded(): void
    {
        $sessionId = $this->createSession(capacity: 3);
        $rejectingStore = new class($this->reservations) implements ReservationRepository {
            public function __construct(private readonly ReservationRepository $inner)
            {
            }

            public function nextIdentity(): ReservationId
            {
                return $this->inner->nextIdentity();
            }

            public function add(Reservation $reservation): void
            {
                // A concurrent duplicate won the race on the unique index.
                throw AlreadyReserved::forSession($reservation->sessionId());
            }

            public function remove(Reservation $reservation): void
            {
                $this->inner->remove($reservation);
            }

            public function ofId(ReservationId $id): ?Reservation
            {
                return $this->inner->ofId($id);
            }

            public function ofUserAndSession(UserId $userId, TestSessionId $sessionId): ?Reservation
            {
                return $this->inner->ofUserAndSession($userId, $sessionId);
            }

            public function ofUser(UserId $userId): array
            {
                return $this->inner->ofUser($userId);
            }
        };
        $handler = new BookSessionHandler($this->sessions, $rejectingStore, $this->seats, $this->clock);

        try {
            $handler(new BookSessionCommand(self::JANE, $sessionId));
            self::fail('The booking should have been refused.');
        } catch (AlreadyReserved) {
        }

        self::assertSame(0, $this->seatsTaken($sessionId));
        self::assertSame(1, $this->seats->releases);
    }

    public function testCancellingGivesTheSeatBack(): void
    {
        $sessionId = $this->createSession(capacity: 3);
        $reservationId = $this->book(self::JANE, $sessionId)->id;

        $this->cancelHandler()(new CancelReservationCommand(self::JANE, $reservationId));

        self::assertSame(0, $this->seatsTaken($sessionId));
        self::assertNull($this->reservations->ofId(ReservationId::fromString($reservationId)));
    }

    public function testNobodyCanCancelAnotherUsersReservation(): void
    {
        $reservationId = $this->book(self::JANE, $this->createSession())->id;

        $this->expectException(ReservationNotFound::class);

        $this->cancelHandler()(new CancelReservationCommand(self::JOHN, $reservationId));
    }

    public function testCancellingAnUnknownReservationFails(): void
    {
        $this->expectException(ReservationNotFound::class);

        $this->cancelHandler()(new CancelReservationCommand(self::JANE, 'ffffffffffffffffffffffff'));
    }

    public function testAReservationCannotBeCancelledOnceTheSessionHasStarted(): void
    {
        $reservationId = $this->book(self::JANE, $this->createSession(scheduledAt: '2026-03-02 09:00:00'))->id;
        $this->clock->travelTo('2026-03-02 10:00:00');

        $this->expectException(SessionAlreadyStarted::class);

        $this->cancelHandler()(new CancelReservationCommand(self::JANE, $reservationId));
    }

    public function testAUserOnlyReadsTheirOwnReservation(): void
    {
        $reservationId = $this->book(self::JANE, $this->createSession())->id;
        $get = new GetReservationHandler($this->reservations, $this->sessions, $this->clock);

        self::assertSame($reservationId, $get(new GetReservationQuery(self::JANE, $reservationId))->id);

        $this->expectException(ReservationNotFound::class);
        $get(new GetReservationQuery(self::JOHN, $reservationId));
    }

    public function testTheListShowsOwnReservationsUpcomingFirstThenPast(): void
    {
        $early = $this->createSession('English', '2026-03-02 09:00:00');
        $late = $this->createSession('French', '2026-03-20 09:00:00');
        $middle = $this->createSession('German', '2026-03-10 09:00:00');
        foreach ([$late, $early, $middle] as $sessionId) {
            $this->book(self::JANE, $sessionId);
        }
        $this->book(self::JOHN, $middle);
        $this->clock->travelTo('2026-03-05 00:00:00'); // the English session is over

        $views = (new ListUserReservationsHandler($this->reservations, $this->sessions, $this->clock))(new ListUserReservationsQuery(self::JANE));

        self::assertSame(
            ['German', 'French', 'English'],
            array_map(static fn (ReservationView $view): string => $view->session->language, $views),
        );
        self::assertFalse($views[2]->canBeCancelled);
    }

    public function testItMapsBookedSessionsToReservations(): void
    {
        $sessionId = $this->createSession();
        $reservationId = $this->book(self::JANE, $sessionId)->id;

        $reserved = (new ListReservedSessionsHandler($this->reservations))(new ListReservedSessionsQuery(self::JANE));

        self::assertSame([$sessionId => $reservationId], $reserved);
    }

    private function createSession(string $language = 'English', string $scheduledAt = '2026-03-10 09:00:00', int $capacity = 20): string
    {
        return (new CreateTestSessionHandler($this->sessions, $this->clock))(
            new CreateTestSessionCommand($language, new \DateTimeImmutable($scheduledAt), 'Paris', $capacity),
        )->id;
    }

    private function book(string $userId, string $sessionId): ReservationView
    {
        return (new BookSessionHandler($this->sessions, $this->reservations, $this->seats, $this->clock))(
            new BookSessionCommand($userId, $sessionId),
        );
    }

    private function cancelHandler(): CancelReservationHandler
    {
        return new CancelReservationHandler($this->reservations, $this->sessions, $this->seats, $this->clock);
    }

    private function seatsTaken(string $sessionId): int
    {
        return $this->sessionRepository()->ofId(TestSessionId::fromString($sessionId))?->seatsTaken() ?? -1;
    }

    private function sessionRepository(): TestSessionRepository
    {
        return $this->sessions;
    }
}
