<?php

declare(strict_types=1);

namespace App\Application\Booking\ListUserReservations;

final readonly class ListUserReservationsQuery
{
    public function __construct(public string $userId)
    {
    }
}
