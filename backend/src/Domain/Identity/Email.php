<?php

declare(strict_types=1);

namespace App\Domain\Identity;

use App\Domain\Identity\Exception\InvalidEmail;

/**
 * A syntactically valid email address, normalised to lower case.
 *
 * Normalisation makes "Jane@Example.com" and "jane@example.com" the same
 * account, which the unique index alone would not guarantee.
 */
final readonly class Email implements \Stringable
{
    public const MAX_LENGTH = 180;

    private function __construct(public string $value)
    {
    }

    public static function fromString(string $email): self
    {
        $normalized = mb_strtolower(trim($email));

        if (
            $normalized === ''
            || mb_strlen($normalized) > self::MAX_LENGTH
            || filter_var($normalized, \FILTER_VALIDATE_EMAIL) === false
        ) {
            throw InvalidEmail::fromValue($email);
        }

        return new self($normalized);
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
