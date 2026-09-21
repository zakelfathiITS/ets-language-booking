<?php

declare(strict_types=1);

namespace App\Domain\Booking;

use App\Domain\Catalog\Exception\SessionAlreadyStarted;
use App\Domain\Catalog\Exception\SessionFull;
use App\Domain\Catalog\Exception\TestSessionNotFound;
use App\Domain\Catalog\TestSessionId;

/**
 * Takes and gives back seats of a session.
 *
 * Implementations must be atomic: two concurrent calls for the last seat
 * cannot both succeed. The rules are those of TestSession::reserveSeat().
 */
interface SeatAllocator
{
    /**
     * @throws TestSessionNotFound
     * @throws SessionAlreadyStarted
     * @throws SessionFull
     */
    public function reserveSeat(TestSessionId $sessionId, \DateTimeImmutable $now): void;

    public function releaseSeat(TestSessionId $sessionId): void;
}
