<?php

declare(strict_types=1);

namespace App\Domain\Shared;

/**
 * Source of the current time.
 *
 * Injected wherever a rule depends on "now", so tests can freeze time instead
 * of relying on the system clock.
 */
interface Clock
{
    public function now(): \DateTimeImmutable;
}
