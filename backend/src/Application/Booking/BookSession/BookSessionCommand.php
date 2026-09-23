<?php

declare(strict_types=1);

namespace App\Application\Booking\BookSession;

final readonly class BookSessionCommand
{
    public string $sessionId;

    /**
     * Ids travel through forms and copy-pastes: surrounding spaces are not part of them.
     */
    public function __construct(
        public string $userId,
        string $sessionId,
    ) {
        $this->sessionId = trim($sessionId);
    }
}
