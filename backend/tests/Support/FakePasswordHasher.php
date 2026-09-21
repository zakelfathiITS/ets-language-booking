<?php

declare(strict_types=1);

namespace App\Tests\Support;

use App\Application\Identity\PasswordHasher;

final class FakePasswordHasher implements PasswordHasher
{
    public function hash(#[\SensitiveParameter] string $plainPassword): string
    {
        return 'hashed:'.$plainPassword;
    }
}
