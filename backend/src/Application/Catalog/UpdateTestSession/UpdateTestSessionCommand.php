<?php

declare(strict_types=1);

namespace App\Application\Catalog\UpdateTestSession;

final readonly class UpdateTestSessionCommand
{
    public function __construct(
        public string $sessionId,
        public string $language,
        public \DateTimeImmutable $scheduledAt,
        public string $location,
        public int $capacity,
    ) {
    }
}
