<?php

declare(strict_types=1);

namespace App\Application\Catalog;

use App\Domain\Catalog\TestSession;

/**
 * Read model of a test session, including the derived availability.
 */
final readonly class TestSessionView
{
    public function __construct(
        public string $id,
        public string $language,
        public \DateTimeImmutable $scheduledAt,
        public string $location,
        public int $capacity,
        public int $seatsTaken,
        public int $seatsAvailable,
        public bool $isFull,
        public bool $hasStarted,
    ) {
    }

    public static function fromSession(TestSession $session, \DateTimeImmutable $now): self
    {
        return new self(
            $session->id()->value,
            $session->language(),
            $session->scheduledAt(),
            $session->location(),
            $session->capacity()->seats,
            $session->seatsTaken(),
            $session->seatsAvailable(),
            $session->isFull(),
            $session->hasStarted($now),
        );
    }
}
