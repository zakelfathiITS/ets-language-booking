<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\MongoDB;

use MongoDB\Driver\Exception\BulkWriteException;
use MongoDB\Driver\Exception\ServerException;

/**
 * Recognises writes rejected by a unique index (MongoDB error code 11000).
 */
final class DuplicateKey
{
    private const ERROR_CODE = 11000;

    public static function isViolation(\Throwable $exception): bool
    {
        if ($exception instanceof BulkWriteException) {
            foreach ($exception->getWriteResult()->getWriteErrors() as $error) {
                if ($error->getCode() === self::ERROR_CODE) {
                    return true;
                }
            }
        }

        return $exception instanceof ServerException && $exception->getCode() === self::ERROR_CODE;
    }
}
