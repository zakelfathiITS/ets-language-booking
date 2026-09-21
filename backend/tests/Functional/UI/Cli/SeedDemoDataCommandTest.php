<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Cli;

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

        $sessions = self::getContainer()->get(DocumentManager::class)->getDocumentCollection(TestSession::class);
        self::assertSame(SeedDemoDataCommand::SESSION_COUNT, $sessions->countDocuments());

        $users = self::getContainer()->get(UserRepository::class);
        $admin = $users->ofEmail(Email::fromString(SeedDemoDataCommand::ADMIN_EMAIL));
        $candidate = $users->ofEmail(Email::fromString(SeedDemoDataCommand::CANDIDATE_EMAIL));
        self::assertNotNull($admin);
        self::assertNotNull($candidate);
        self::assertTrue($admin->hasRole(Role::Admin));
        self::assertFalse($candidate->hasRole(Role::Admin));
    }
}
