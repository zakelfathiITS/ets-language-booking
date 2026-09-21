<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exception;

/**
 * The requested change would break a business rule of an aggregate.
 */
abstract class InvariantViolationException extends DomainException
{
}
