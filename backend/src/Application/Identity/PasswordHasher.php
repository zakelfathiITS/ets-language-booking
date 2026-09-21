<?php

declare(strict_types=1);

namespace App\Application\Identity;

interface PasswordHasher
{
    public function hash(string $plainPassword): string;
}
