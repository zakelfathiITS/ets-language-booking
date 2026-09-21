<?php

declare(strict_types=1);

namespace App\Tests\Unit\Infrastructure\Security;

use App\Infrastructure\Security\SecurityUser;
use App\Infrastructure\Security\UserByEmailProvider;
use App\Tests\Support\FrozenClock;
use App\Tests\Support\InMemory\InMemoryUserRepository;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactoryInterface;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;

#[CoversClass(UserByEmailProvider::class)]
final class UserByEmailProviderTest extends TestCase
{
    #[TestWith(['nobody@example.com'])]
    #[TestWith(['not an email'])]
    public function testAnUnknownAccountCostsAPasswordHashLikeAWrongPassword(string $identifier): void
    {
        $hasher = $this->createMock(PasswordHasherInterface::class);
        $hasher->expects(self::once())->method('hash');
        $factory = $this->createMock(PasswordHasherFactoryInterface::class);
        $factory->method('getPasswordHasher')->with(SecurityUser::class)->willReturn($hasher);

        $provider = new UserByEmailProvider(new InMemoryUserRepository(), new FrozenClock(), $factory);

        $this->expectException(UserNotFoundException::class);
        $provider->loadUserByIdentifier($identifier);
    }
}
