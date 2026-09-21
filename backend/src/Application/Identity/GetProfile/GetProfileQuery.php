<?php

declare(strict_types=1);

namespace App\Application\Identity\GetProfile;

final readonly class GetProfileQuery
{
    public function __construct(public string $userId)
    {
    }
}
