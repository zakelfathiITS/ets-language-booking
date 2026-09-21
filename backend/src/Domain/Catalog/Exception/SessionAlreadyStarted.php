<?php

declare(strict_types=1);

namespace App\Domain\Catalog\Exception;

use App\Domain\Catalog\TestSessionId;
use App\Domain\Shared\Exception\ConflictException;

/**
 * Bookings are frozen once a session has started: it can no longer be booked
 * nor cancelled.
 */
final class SessionAlreadyStarted extends ConflictException
{
    public static function withId(TestSessionId $id): self
    {
        return new self(sprintf('Session "%s" has already started: its bookings can no longer change.', $id));
    }

    public function errorCode(): string
    {
        return 'session_already_started';
    }
}
