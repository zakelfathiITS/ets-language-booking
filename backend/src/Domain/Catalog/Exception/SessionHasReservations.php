<?php

declare(strict_types=1);

namespace App\Domain\Catalog\Exception;

use App\Domain\Shared\Exception\ConflictException;

final class SessionHasReservations extends ConflictException
{
    public static function withSeatsTaken(int $seatsTaken): self
    {
        return new self(sprintf('The session cannot be deleted: %d seat(s) are booked.', $seatsTaken));
    }

    public function errorCode(): string
    {
        return 'session_has_reservations';
    }
}
