<?php

declare(strict_types=1);

namespace App\Application\Booking\GetReservation;

use App\Application\Booking\ReservationView;
use App\Application\Catalog\TestSessionView;
use App\Domain\Booking\Exception\ReservationNotFound;
use App\Domain\Booking\ReservationId;
use App\Domain\Booking\ReservationRepository;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Identity\UserId;
use App\Domain\Shared\Clock;

final readonly class GetReservationHandler
{
    public function __construct(
        private ReservationRepository $reservations,
        private TestSessionRepository $sessions,
        private Clock $clock,
    ) {
    }

    /**
     * @throws ReservationNotFound also when the reservation belongs to someone else
     */
    public function __invoke(GetReservationQuery $query): ReservationView
    {
        $id = ReservationId::fromString($query->reservationId);
        $reservation = $this->reservations->ofId($id);

        if ($reservation === null || !$reservation->isOwnedBy(UserId::fromString($query->userId))) {
            throw ReservationNotFound::withId($id);
        }

        $session = $this->sessions->ofId($reservation->sessionId()) ?? throw ReservationNotFound::withId($id);

        return ReservationView::from($reservation, TestSessionView::fromSession($session, $this->clock->now()));
    }
}
