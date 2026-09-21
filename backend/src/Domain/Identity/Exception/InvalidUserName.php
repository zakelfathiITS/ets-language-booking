<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exception;

use App\Domain\Shared\Exception\InvariantViolationException;

final class InvalidUserName extends InvariantViolationException
{
    public static function lengthOutOfRange(int $min, int $max): self
    {
        return new self(sprintf('A name must contain between %d and %d characters.', $min, $max));
    }

    public function errorCode(): string
    {
        return 'invalid_name';
    }
}
