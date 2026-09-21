<?php

declare(strict_types=1);

namespace App\Domain\Catalog\Exception;

use App\Domain\Shared\Exception\InvariantViolationException;

final class InvalidTestSession extends InvariantViolationException
{
    private function __construct(string $message, private readonly string $errorCode)
    {
        parent::__construct($message);
    }

    public static function notInTheFuture(): self
    {
        return new self('A session must be scheduled in the future.', 'session_in_past');
    }

    public static function capacityOutOfRange(int $min, int $max): self
    {
        return new self(sprintf('A session must offer between %d and %d seats.', $min, $max), 'invalid_capacity');
    }

    public static function languageLength(int $min, int $max): self
    {
        return new self(sprintf('A language must contain between %d and %d characters.', $min, $max), 'invalid_language');
    }

    public static function locationLength(int $min, int $max): self
    {
        return new self(sprintf('A location must contain between %d and %d characters.', $min, $max), 'invalid_location');
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }
}
