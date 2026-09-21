<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exception;

/**
 * The request is valid but conflicts with the current state
 * (duplicate resource, no seat left, ...).
 */
abstract class ConflictException extends DomainException
{
}
