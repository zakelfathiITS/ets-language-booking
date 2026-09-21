<?php

declare(strict_types=1);

namespace App\Domain\Booking\Exception;

use App\Domain\Booking\ReservationId;
use App\Domain\Shared\Exception\NotFoundException;

/**
 * Also raised for reservations owned by someone else, so their existence is
 * never disclosed.
 */
final class ReservationNotFound extends NotFoundException
{
    public static function withId(ReservationId $id): self
    {
        return new self(sprintf('Reservation "%s" does not exist.', $id));
    }

    public function errorCode(): string
    {
        return 'reservation_not_found';
    }
}
