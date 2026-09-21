<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain\Identity;

use App\Domain\Identity\Email;
use App\Domain\Identity\Exception\InvalidUserName;
use App\Domain\Identity\Role;
use App\Domain\Identity\User;
use App\Domain\Identity\UserId;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(User::class)]
#[CoversClass(UserId::class)]
#[CoversClass(InvalidUserName::class)]
final class UserTest extends TestCase
{
    public function testRegistrationGrantsTheUserRole(): void
    {
        $user = $this->registerUser();

        self::assertSame('Jane Doe', $user->name());
        self::assertSame('jane@example.com', $user->email()->value);
        self::assertSame([Role::User], $user->roles());
        self::assertFalse($user->hasRole(Role::Admin));
    }

    public function testRegistrationTrimsTheName(): void
    {
        self::assertSame('Jane Doe', $this->registerUser(name: '  Jane Doe ')->name());
    }

    #[DataProvider('invalidNames')]
    public function testItRejectsNamesOfInvalidLength(string $name): void
    {
        $this->expectException(InvalidUserName::class);

        $this->registerUser(name: $name);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function invalidNames(): iterable
    {
        yield 'too short' => ['J'];
        yield 'only spaces' => ['    '];
        yield 'too long' => [str_repeat('a', User::NAME_MAX_LENGTH + 1)];
    }

    public function testUpdatingTheProfileChangesNameEmailAndUpdateDate(): void
    {
        $user = $this->registerUser();
        $later = new \DateTimeImmutable('2026-02-01 08:00:00');

        $user->updateProfile('Jane Smith', Email::fromString('jane.smith@example.com'), $later);

        self::assertSame('Jane Smith', $user->name());
        self::assertSame('jane.smith@example.com', $user->email()->value);
        self::assertEquals($later, $user->updatedAt());
        self::assertNotEquals($later, $user->createdAt());
    }

    public function testGrantingARoleIsIdempotent(): void
    {
        $user = $this->registerUser();
        $now = new \DateTimeImmutable('2026-02-01 08:00:00');

        $user->grantRole(Role::Admin, $now);
        $user->grantRole(Role::Admin, $now);

        self::assertSame([Role::User, Role::Admin], $user->roles());
        self::assertTrue($user->hasRole(Role::Admin));
    }

    public function testThePasswordHashCanBeReplaced(): void
    {
        $user = $this->registerUser();

        $user->changePasswordHash('new-hash', new \DateTimeImmutable());

        self::assertSame('new-hash', $user->passwordHash());
    }

    public function testAnEmptyPasswordHashIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->registerUser(passwordHash: '');
    }

    private function registerUser(string $name = 'Jane Doe', string $passwordHash = 'hash'): User
    {
        return User::register(
            UserId::fromString('65f000000000000000000001'),
            $name,
            Email::fromString('jane@example.com'),
            $passwordHash,
            new \DateTimeImmutable('2026-01-15 10:00:00'),
        );
    }
}
