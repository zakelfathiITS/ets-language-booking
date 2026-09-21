<?php

declare(strict_types=1);

namespace App\Domain\Booking\Exception;

use App\Domain\Catalog\TestSessionId;
use App\Domain\Shared\Exception\ConflictException;

final class AlreadyReserved extends ConflictException
{
    public static function forSession(TestSessionId $sessionId): self
    {
        return new self(sprintf('You already hold a reservation for session "%s".', $sessionId));
    }

    public function errorCode(): string
    {
        return 'already_reserved';
    }
}
