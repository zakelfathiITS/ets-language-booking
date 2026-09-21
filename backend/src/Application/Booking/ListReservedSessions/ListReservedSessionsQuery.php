<?php

declare(strict_types=1);

namespace App\Application\Booking\ListReservedSessions;

final readonly class ListReservedSessionsQuery
{
    public function __construct(public string $userId)
    {
    }
}
