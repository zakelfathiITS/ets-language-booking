<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain\Booking;

use App\Domain\Booking\Reservation;
use App\Domain\Booking\ReservationId;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Identity\UserId;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(Reservation::class)]
final class ReservationTest extends TestCase
{
    public function testItRecordsWhoBookedWhichSessionAndWhen(): void
    {
        $now = new \DateTimeImmutable('2026-03-01 12:00:00');
        $reservation = Reservation::book(
            ReservationId::fromString('r1'),
            TestSessionId::fromString('s1'),
            UserId::fromString('u1'),
            $now,
        );

        self::assertSame('r1', $reservation->id()->value);
        self::assertSame('s1', $reservation->sessionId()->value);
        self::assertSame('u1', $reservation->userId()->value);
        self::assertSame($now, $reservation->reservedAt());
        self::assertTrue($reservation->isOwnedBy(UserId::fromString('u1')));
        self::assertFalse($reservation->isOwnedBy(UserId::fromString('u2')));
    }
}
