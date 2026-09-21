<?php

declare(strict_types=1);

namespace App\Application\Booking\BookSession;

use App\Application\Booking\ReservationView;
use App\Application\Catalog\TestSessionView;
use App\Domain\Booking\Exception\AlreadyReserved;
use App\Domain\Booking\Reservation;
use App\Domain\Booking\ReservationRepository;
use App\Domain\Booking\SeatAllocator;
use App\Domain\Catalog\Exception\SessionAlreadyStarted;
use App\Domain\Catalog\Exception\SessionFull;
use App\Domain\Catalog\Exception\TestSessionNotFound;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Identity\UserId;
use App\Domain\Shared\Clock;

/**
 * Books a seat in a session for a user.
 *
 * Correctness under concurrency does not rely on the checks below but on two
 * atomic guarantees of the storage: the seat allocator never oversells, and
 * the reservation store rejects a second booking of the same session by the
 * same user. The checks only make the common case answer with a clear error.
 */
final readonly class BookSessionHandler
{
    public function __construct(
        private TestSessionRepository $sessions,
        private ReservationRepository $reservations,
        private SeatAllocator $seats,
        private Clock $clock,
    ) {
    }

    /**
     * @throws TestSessionNotFound
     * @throws AlreadyReserved
     * @throws SessionAlreadyStarted
     * @throws SessionFull
     */
    public function __invoke(BookSessionCommand $command): ReservationView
    {
        $userId = UserId::fromString($command->userId);
        $sessionId = TestSessionId::fromString($command->sessionId);
        $now = $this->clock->now();

        if ($this->sessions->ofId($sessionId) === null) {
            throw TestSessionNotFound::withId($sessionId);
        }

        if ($this->reservations->ofUserAndSession($userId, $sessionId) !== null) {
            throw AlreadyReserved::forSession($sessionId);
        }

        $this->seats->reserveSeat($sessionId, $now);

        $reservation = Reservation::book($this->reservations->nextIdentity(), $sessionId, $userId, $now);

        try {
            $this->reservations->add($reservation);
        } catch (\Throwable $exception) {
            // Compensation: the seat was taken but the booking was refused
            // (typically a concurrent duplicate request): give it back.
            $this->seats->releaseSeat($sessionId);

            throw $exception;
        }

        $session = $this->sessions->ofId($sessionId) ?? throw TestSessionNotFound::withId($sessionId);

        return ReservationView::from($reservation, TestSessionView::fromSession($session, $now));
    }
}
