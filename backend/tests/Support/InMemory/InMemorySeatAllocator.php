<?php

declare(strict_types=1);

namespace App\Tests\Support\InMemory;

use App\Domain\Booking\SeatAllocator;
use App\Domain\Catalog\Exception\TestSessionNotFound;
use App\Domain\Catalog\TestSessionId;

/**
 * Applies the seat rules of the TestSession aggregate directly (no concurrency in memory).
 */
final class InMemorySeatAllocator implements SeatAllocator
{
    public int $releases = 0;

    public function __construct(private readonly InMemoryTestSessionRepository $sessions)
    {
    }

    public function reserveSeat(TestSessionId $sessionId, \DateTimeImmutable $now): void
    {
        $session = $this->sessions->ofId($sessionId) ?? throw TestSessionNotFound::withId($sessionId);
        $session->reserveSeat($now);
    }

    public function releaseSeat(TestSessionId $sessionId): void
    {
        ++$this->releases;
        $this->sessions->ofId($sessionId)?->releaseSeat();
    }
}
