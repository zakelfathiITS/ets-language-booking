<?php

declare(strict_types=1);

namespace App\Application\Catalog\CreateTestSession;

final readonly class CreateTestSessionCommand
{
    public function __construct(
        public string $language,
        public \DateTimeImmutable $scheduledAt,
        public string $location,
        public int $capacity,
    ) {
    }
}
