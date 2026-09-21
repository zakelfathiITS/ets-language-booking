<?php

declare(strict_types=1);

namespace App\Tests\Integration\Infrastructure\Persistence\MongoDB;

use App\Application\Shared\Health\DatabaseHealthCheck;
use App\Infrastructure\Persistence\MongoDB\MongoDatabaseHealthCheck;
use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\Client;
use PHPUnit\Framework\Attributes\CoversClass;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

#[CoversClass(MongoDatabaseHealthCheck::class)]
final class MongoDatabaseHealthCheckTest extends KernelTestCase
{
    public function testItReportsTheConfiguredDatabaseAsAvailable(): void
    {
        self::bootKernel();

        self::assertTrue(self::getContainer()->get(DatabaseHealthCheck::class)->isAvailable());
    }

    public function testItReportsAnUnreachableServerAsUnavailable(): void
    {
        $documentManager = $this->createStub(DocumentManager::class);
        $documentManager->method('getClient')->willReturn(
            new Client('mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=200'),
        );

        self::assertFalse((new MongoDatabaseHealthCheck($documentManager))->isAvailable());
    }
}
