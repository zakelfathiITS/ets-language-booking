<?php

declare(strict_types=1);

namespace App\Tests\Unit\Application\Identity;

use App\Application\Identity\RegisterUser\RegisterUserCommand;
use App\Application\Identity\RegisterUser\RegisterUserHandler;
use App\Application\Identity\UserProfile;
use App\Domain\Identity\Email;
use App\Domain\Identity\Exception\EmailAlreadyInUse;
use App\Tests\Support\FakePasswordHasher;
use App\Tests\Support\FrozenClock;
use App\Tests\Support\InMemory\InMemoryUserRepository;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(RegisterUserHandler::class)]
#[CoversClass(UserProfile::class)]
final class RegisterUserHandlerTest extends TestCase
{
    private InMemoryUserRepository $users;
    private RegisterUserHandler $handler;

    protected function setUp(): void
    {
        $this->users = new InMemoryUserRepository();
        $this->handler = new RegisterUserHandler($this->users, new FakePasswordHasher(), new FrozenClock('2026-01-15 10:00:00'));
    }

    public function testItRegistersAUserWithAHashedPassword(): void
    {
        $profile = ($this->handler)(new RegisterUserCommand('Jane Doe', 'Jane@Example.com', 'S3cure-passw0rd'));

        self::assertSame('jane@example.com', $profile->email);
        self::assertSame(['ROLE_USER'], $profile->roles);
        self::assertSame('2026-01-15T10:00:00+00:00', $profile->createdAt->format(\DATE_ATOM));

        $stored = $this->users->ofEmail(Email::fromString('jane@example.com'));
        self::assertNotNull($stored);
        self::assertSame('hashed:S3cure-passw0rd', $stored->passwordHash());
    }

    public function testAnEmailCanOnlyBeRegisteredOnceWhateverItsCase(): void
    {
        ($this->handler)(new RegisterUserCommand('Jane Doe', 'jane@example.com', 'S3cure-passw0rd'));

        $this->expectException(EmailAlreadyInUse::class);

        ($this->handler)(new RegisterUserCommand('Jane Again', 'JANE@example.com', 'An0ther-passw0rd'));
    }
}
