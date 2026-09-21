<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exception;

use App\Domain\Shared\Exception\InvariantViolationException;

final class InvalidEmail extends InvariantViolationException
{
    public static function fromValue(string $value): self
    {
        return new self(sprintf('"%s" is not a valid email address.', $value));
    }

    public function errorCode(): string
    {
        return 'invalid_email';
    }
}
