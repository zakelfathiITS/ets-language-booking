<?php

declare(strict_types=1);

namespace App\Application\Booking\BookSession;

final readonly class BookSessionCommand
{
    public function __construct(
        public string $userId,
        public string $sessionId,
    ) {
    }
}
