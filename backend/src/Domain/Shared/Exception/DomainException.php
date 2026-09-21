<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exception;

/**
 * Root of every business error raised by the domain.
 *
 * Subclasses pick a category (not found, conflict, invariant violation) that the
 * HTTP layer translates into a status code, so the domain never knows about HTTP.
 */
abstract class DomainException extends \RuntimeException
{
    /**
     * Stable, machine-readable identifier exposed to API clients (e.g. "session_full").
     */
    abstract public function errorCode(): string;
}
