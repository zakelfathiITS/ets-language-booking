<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exception;

/**
 * The requested resource does not exist, or is not visible to the caller.
 */
abstract class NotFoundException extends DomainException
{
}
