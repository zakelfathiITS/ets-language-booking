<?php

declare(strict_types=1);

namespace App\Application\Catalog\DeleteTestSession;

final readonly class DeleteTestSessionCommand
{
    public function __construct(public string $sessionId)
    {
    }
}
