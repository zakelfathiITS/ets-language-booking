<?php

declare(strict_types=1);

namespace App\Application\Booking\GetReservation;

final readonly class GetReservationQuery
{
    public function __construct(
        public string $userId,
        public string $reservationId,
    ) {
    }
}
