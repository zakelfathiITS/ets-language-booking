<?php

declare(strict_types=1);

namespace App\Application\Booking\CancelReservation;

use App\Domain\Booking\Exception\ReservationNotFound;
use App\Domain\Booking\ReservationId;
use App\Domain\Booking\ReservationRepository;
use App\Domain\Booking\SeatAllocator;
use App\Domain\Catalog\Exception\SessionAlreadyStarted;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Identity\UserId;
use App\Domain\Shared\Clock;

final readonly class CancelReservationHandler
{
    public function __construct(
        private ReservationRepository $reservations,
        private TestSessionRepository $sessions,
        private SeatAllocator $seats,
        private Clock $clock,
    ) {
    }

    /**
     * @throws ReservationNotFound   also when the reservation belongs to someone else
     * @throws SessionAlreadyStarted a session that took place is history
     */
    public function __invoke(CancelReservationCommand $command): void
    {
        $id = ReservationId::fromString($command->reservationId);
        $reservation = $this->reservations->ofId($id);

        if ($reservation === null || !$reservation->isOwnedBy(UserId::fromString($command->userId))) {
            throw ReservationNotFound::withId($id);
        }

        $this->sessions->ofId($reservation->sessionId())?->ensureBookingsCanChange($this->clock->now());

        // Remove first: if releasing the seat then fails, the session keeps one
        // unused seat, which is safe; the opposite order could oversell.
        $this->reservations->remove($reservation);
        $this->seats->releaseSeat($reservation->sessionId());
    }
}
