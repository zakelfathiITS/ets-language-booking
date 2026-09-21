<?php

declare(strict_types=1);

namespace App\Tests\Unit\Application\Identity;

use App\Application\Identity\GetProfile\GetProfileHandler;
use App\Application\Identity\GetProfile\GetProfileQuery;
use App\Application\Identity\RegisterUser\RegisterUserCommand;
use App\Application\Identity\RegisterUser\RegisterUserHandler;
use App\Application\Identity\UpdateProfile\UpdateProfileCommand;
use App\Application\Identity\UpdateProfile\UpdateProfileHandler;
use App\Domain\Identity\Exception\EmailAlreadyInUse;
use App\Domain\Identity\Exception\UserNotFound;
use App\Tests\Support\FakePasswordHasher;
use App\Tests\Support\FrozenClock;
use App\Tests\Support\InMemory\InMemoryUserRepository;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(GetProfileHandler::class)]
#[CoversClass(UpdateProfileHandler::class)]
#[CoversClass(UserNotFound::class)]
final class ProfileHandlersTest extends TestCase
{
    private InMemoryUserRepository $users;
    private FrozenClock $clock;
    private string $janeId;

    protected function setUp(): void
    {
        $this->users = new InMemoryUserRepository();
        $this->clock = new FrozenClock('2026-01-15 10:00:00');
        $register = new RegisterUserHandler($this->users, new FakePasswordHasher(), $this->clock);

        $this->janeId = $register(new RegisterUserCommand('Jane Doe', 'jane@example.com', 'S3cure-passw0rd'))->id;
        $register(new RegisterUserCommand('John Doe', 'john@example.com', 'S3cure-passw0rd'));
    }

    public function testItReturnsTheProfileOfAUser(): void
    {
        $profile = (new GetProfileHandler($this->users))(new GetProfileQuery($this->janeId));

        self::assertSame('Jane Doe', $profile->name);
        self::assertSame('jane@example.com', $profile->email);
    }

    public function testAnUnknownUserIsReportedAsNotFound(): void
    {
        $this->expectException(UserNotFound::class);

        (new GetProfileHandler($this->users))(new GetProfileQuery('ffffffffffffffffffffffff'));
    }

    public function testItUpdatesNameAndEmail(): void
    {
        $this->clock->travelTo('2026-02-01 09:30:00');

        $profile = $this->updateHandler()(new UpdateProfileCommand($this->janeId, 'Jane Smith', 'Jane.Smith@example.com'));

        self::assertSame('Jane Smith', $profile->name);
        self::assertSame('jane.smith@example.com', $profile->email);
    }

    public function testKeepingOnesOwnEmailIsNotAConflict(): void
    {
        $profile = $this->updateHandler()(new UpdateProfileCommand($this->janeId, 'Jane Smith', 'JANE@example.com'));

        self::assertSame('jane@example.com', $profile->email);
    }

    public function testTakingTheEmailOfAnotherAccountIsAConflict(): void
    {
        $this->expectException(EmailAlreadyInUse::class);

        $this->updateHandler()(new UpdateProfileCommand($this->janeId, 'Jane Doe', 'john@example.com'));
    }

    private function updateHandler(): UpdateProfileHandler
    {
        return new UpdateProfileHandler($this->users, $this->clock);
    }
}
