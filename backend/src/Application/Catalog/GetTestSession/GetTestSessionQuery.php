<?php

declare(strict_types=1);

namespace App\Application\Catalog\GetTestSession;

final readonly class GetTestSessionQuery
{
    public function __construct(public string $sessionId)
    {
    }
}
