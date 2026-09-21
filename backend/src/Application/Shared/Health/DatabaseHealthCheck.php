<?php

declare(strict_types=1);

namespace App\Application\Shared\Health;

/**
 * Tells whether the primary database can currently serve requests.
 */
interface DatabaseHealthCheck
{
    public function isAvailable(): bool;
}
