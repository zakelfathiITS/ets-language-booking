<?php

declare(strict_types=1);

namespace App\Domain\Catalog\Exception;

use App\Domain\Shared\Exception\ConflictException;

final class CapacityBelowReservedSeats extends ConflictException
{
    public static function create(int $requestedCapacity, int $seatsTaken): self
    {
        return new self(sprintf(
            'The capacity cannot be lowered to %d: %d seat(s) are already booked.',
            $requestedCapacity,
            $seatsTaken,
        ));
    }

    public function errorCode(): string
    {
        return 'capacity_below_reserved_seats';
    }
}
