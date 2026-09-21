<?php

declare(strict_types=1);

namespace App\Tests\Support;

use App\Domain\Catalog\TestSession;

/**
 * Seats are booked by the Booking context; catalogue tests only need the
 * resulting state, so they set it directly.
 */
final class TestSessionState
{
    public static function withSeatsTaken(TestSession $session, int $seatsTaken): TestSession
    {
        (new \ReflectionProperty(TestSession::class, 'seatsTaken'))->setValue($session, $seatsTaken);

        return $session;
    }
}
