<?php

declare(strict_types=1);

namespace App\Tests\Support;

use App\Domain\Shared\Clock;

/**
 * Clock test double: time only moves when the test says so.
 */
final class FrozenClock implements Clock
{
    private \DateTimeImmutable $now;

    public function __construct(string $now = '2026-01-15 10:00:00')
    {
        $this->now = new \DateTimeImmutable($now, new \DateTimeZone('UTC'));
    }

    public function now(): \DateTimeImmutable
    {
        return $this->now;
    }

    public function travelTo(string $moment): void
    {
        $this->now = new \DateTimeImmutable($moment, new \DateTimeZone('UTC'));
    }
}
