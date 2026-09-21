<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exception;

use App\Domain\Identity\UserId;
use App\Domain\Shared\Exception\NotFoundException;

final class UserNotFound extends NotFoundException
{
    public static function withId(UserId $id): self
    {
        return new self(sprintf('User "%s" does not exist.', $id));
    }

    public function errorCode(): string
    {
        return 'user_not_found';
    }
}
