<?php

declare(strict_types=1);

namespace App\Domain\Catalog;

use App\Domain\Catalog\Exception\InvalidTestSession;

/**
 * Number of seats offered by a session.
 */
final readonly class Capacity
{
    public const MIN = 1;
    public const MAX = 1000;

    private function __construct(public int $seats)
    {
    }

    public static function of(int $seats): self
    {
        if ($seats < self::MIN || $seats > self::MAX) {
            throw InvalidTestSession::capacityOutOfRange(self::MIN, self::MAX);
        }

        return new self($seats);
    }
}
