<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Cli;

use App\Domain\Booking\Reservation;
use App\Domain\Catalog\TestSession;
use App\Domain\Identity\Email;
use App\Domain\Identity\Role;
use App\Domain\Identity\UserRepository;
use App\Tests\Support\ResetsDatabase;
use App\UI\Cli\SeedDemoDataCommand;
use Doctrine\ODM\MongoDB\DocumentManager;
use PHPUnit\Framework\Attributes\CoversClass;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Tester\CommandTester;

#[CoversClass(SeedDemoDataCommand::class)]
final class SeedDemoDataCommandTest extends KernelTestCase
{
    use ResetsDatabase;

    public function testItLoadsDemoDataOnceOnly(): void
    {
        $kernel = self::bootKernel();
        self::resetDatabase();
        $tester = new CommandTester((new Application($kernel))->find('app:seed'));

        self::assertSame(0, $tester->execute([]));
        self::assertStringContainsString(SeedDemoDataCommand::ADMIN_EMAIL, $tester->getDisplay());
        self::assertSame(0, $tester->execute([]));
        self::assertStringContainsString('already loaded', $tester->getDisplay());

        $documentManager = self::getContainer()->get(DocumentManager::class);
        $sessions = $documentManager->getDocumentCollection(TestSession::class);
        self::assertSame(SeedDemoDataCommand::SESSION_COUNT, $sessions->countDocuments());
        self::assertSame(1, $sessions->countDocuments(['capacity' => 1, 'seats_taken' => 1]), 'One session is shown as full.');
        self::assertSame(
            \count(SeedDemoDataCommand::CANDIDATE_BOOKINGS) + 1,
            $documentManager->getDocumentCollection(Reservation::class)->countDocuments(),
        );

        $users = self::getContainer()->get(UserRepository::class);
        $admin = $users->ofEmail(Email::fromString(SeedDemoDataCommand::ADMIN_EMAIL));
        $candidate = $users->ofEmail(Email::fromString(SeedDemoDataCommand::CANDIDATE_EMAIL));
        self::assertNotNull($admin);
        self::assertNotNull($candidate);
        self::assertTrue($admin->hasRole(Role::Admin));
        self::assertFalse($candidate->hasRole(Role::Admin));
    }
}
