<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exception;

use App\Domain\Identity\Email;
use App\Domain\Shared\Exception\ConflictException;

final class EmailAlreadyInUse extends ConflictException
{
    public static function forEmail(Email $email): self
    {
        return new self(sprintf('The email "%s" is already used by another account.', $email));
    }

    public function errorCode(): string
    {
        return 'email_already_in_use';
    }
}
