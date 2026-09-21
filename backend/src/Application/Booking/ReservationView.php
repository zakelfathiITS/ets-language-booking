<?php

declare(strict_types=1);

namespace App\Application\Booking;

use App\Application\Catalog\TestSessionView;
use App\Domain\Booking\Reservation;

/**
 * Read model of a reservation, with the session it is for.
 */
final readonly class ReservationView
{
    public function __construct(
        public string $id,
        public \DateTimeImmutable $reservedAt,
        public TestSessionView $session,
        public bool $canBeCancelled,
    ) {
    }

    public static function from(Reservation $reservation, TestSessionView $session): self
    {
        return new self(
            $reservation->id()->value,
            $reservation->reservedAt(),
            $session,
            !$session->hasStarted,
        );
    }
}
