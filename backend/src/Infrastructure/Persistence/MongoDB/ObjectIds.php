<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\MongoDB;

final class ObjectIds
{
    /**
     * Identifiers come from URLs and tokens: anything that is not an ObjectId
     * simply matches no document, instead of making the driver throw.
     */
    public static function isValid(string $value): bool
    {
        return preg_match('/^[0-9a-f]{24}$/i', $value) === 1;
    }
}
