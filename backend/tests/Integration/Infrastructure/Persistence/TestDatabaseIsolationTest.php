<?php

declare(strict_types=1);

namespace App\Tests\Integration\Infrastructure\Persistence;

use Doctrine\ODM\MongoDB\DocumentManager;
use PHPUnit\Framework\Attributes\CoversNothing;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * Guards the test setup itself: suites that purge collections must never be
 * able to reach the development database.
 */
#[CoversNothing]
final class TestDatabaseIsolationTest extends KernelTestCase
{
    public function testTheTestKernelTargetsTheDedicatedTestDatabase(): void
    {
        self::bootKernel();

        $documentManager = self::getContainer()->get(DocumentManager::class);

        self::assertSame('ets_booking_test', $documentManager->getConfiguration()->getDefaultDB());
    }
}
