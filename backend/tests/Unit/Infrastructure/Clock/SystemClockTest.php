<?php

declare(strict_types=1);

namespace App\Tests\Unit\Infrastructure\Clock;

use App\Infrastructure\Clock\SystemClock;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(SystemClock::class)]
final class SystemClockTest extends TestCase
{
    public function testItReturnsTheCurrentTimeInUtc(): void
    {
        $before = new \DateTimeImmutable();
        $now = (new SystemClock())->now();
        $after = new \DateTimeImmutable();

        self::assertSame('UTC', $now->getTimezone()->getName());
        self::assertGreaterThanOrEqual($before, $now);
        self::assertLessThanOrEqual($after, $now);
    }
}
