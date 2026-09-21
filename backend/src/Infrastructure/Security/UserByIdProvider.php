<?php

declare(strict_types=1);

namespace App\Infrastructure\Security;

use App\Domain\Identity\UserId;
use App\Domain\Identity\UserRepository;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

/**
 * Loads users from the "sub" claim of a JWT (api firewall).
 *
 * Reading the account on every request means a deleted user or a revoked
 * role takes effect immediately, at the cost of one indexed lookup.
 *
 * @implements UserProviderInterface<SecurityUser>
 */
final readonly class UserByIdProvider implements UserProviderInterface
{
    public function __construct(private UserRepository $users)
    {
    }

    public function loadUserByIdentifier(string $identifier): SecurityUser
    {
        $user = trim($identifier) === '' ? null : $this->users->ofId(UserId::fromString($identifier));

        if ($user === null) {
            $exception = new UserNotFoundException();
            $exception->setUserIdentifier($identifier);

            throw $exception;
        }

        return SecurityUser::fromUser($user);
    }

    public function refreshUser(UserInterface $user): SecurityUser
    {
        throw new UnsupportedUserException('The API is stateless: users are never refreshed from a session.');
    }

    public function supportsClass(string $class): bool
    {
        return $class === SecurityUser::class;
    }
}
