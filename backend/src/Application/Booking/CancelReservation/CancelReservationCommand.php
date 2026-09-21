<?php

declare(strict_types=1);

namespace App\Application\Booking\CancelReservation;

final readonly class CancelReservationCommand
{
    public function __construct(
        public string $userId,
        public string $reservationId,
    ) {
    }
}
