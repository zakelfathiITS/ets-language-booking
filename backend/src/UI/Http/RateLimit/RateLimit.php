<?php

declare(strict_types=1);

namespace App\UI\Http\RateLimit;

/**
 * Limits how often a route may be called, per signed-in user or, for
 * anonymous callers, per client address.
 *
 * $limiter names a limiter of config/packages/rate_limiter.yaml.
 */
#[\Attribute(\Attribute::TARGET_METHOD)]
final readonly class RateLimit
{
    public function __construct(public string $limiter)
    {
    }
}
