<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\MongoDB;

use App\Application\Shared\Health\DatabaseHealthCheck;
use Doctrine\ODM\MongoDB\DocumentManager;

final class MongoDatabaseHealthCheck implements DatabaseHealthCheck
{
    public function __construct(private readonly DocumentManager $documentManager)
    {
    }

    public function isAvailable(): bool
    {
        try {
            $this->documentManager->getClient()->selectDatabase('admin')->command(['ping' => 1]);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
