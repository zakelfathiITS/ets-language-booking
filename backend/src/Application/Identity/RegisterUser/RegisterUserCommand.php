<?php

declare(strict_types=1);

namespace App\Application\Identity\RegisterUser;

final readonly class RegisterUserCommand
{
    public function __construct(
        public string $name,
        public string $email,
        #[\SensitiveParameter]
        public string $plainPassword,
    ) {
    }
}
