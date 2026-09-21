<?php

declare(strict_types=1);

namespace App\Application\Identity\UpdateProfile;

final readonly class UpdateProfileCommand
{
    public function __construct(
        public string $userId,
        public string $name,
        public string $email,
    ) {
    }
}
