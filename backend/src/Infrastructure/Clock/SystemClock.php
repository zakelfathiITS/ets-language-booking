<?php

declare(strict_types=1);

namespace App\Infrastructure\Clock;

use App\Domain\Shared\Clock;

/**
 * Real-time clock. Every date handled by the application is in UTC.
 */
final class SystemClock implements Clock
{
    public function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
    }
}
