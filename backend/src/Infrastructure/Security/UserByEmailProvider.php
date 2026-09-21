<?php

declare(strict_types=1);

namespace App\Infrastructure\Security;

use App\Domain\Identity\Email;
use App\Domain\Identity\Exception\InvalidEmail;
use App\Domain\Identity\UserId;
use App\Domain\Identity\UserRepository;
use App\Domain\Shared\Clock;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

/**
 * Loads users by email for the login form (json_login firewall).
 *
 * @implements UserProviderInterface<SecurityUser>
 */
final readonly class UserByEmailProvider implements UserProviderInterface, PasswordUpgraderInterface
{
    public function __construct(
        private UserRepository $users,
        private Clock $clock,
    ) {
    }

    public function loadUserByIdentifier(string $identifier): SecurityUser
    {
        try {
            $user = $this->users->ofEmail(Email::fromString($identifier));
        } catch (InvalidEmail) {
            $user = null;
        }

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

    /**
     * Re-hashes the password on login when the hashing algorithm or cost changed.
     */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof SecurityUser) {
            return;
        }

        $domainUser = $this->users->ofId(UserId::fromString($user->getUserIdentifier()));
        if ($domainUser === null) {
            return;
        }

        $domainUser->changePasswordHash($newHashedPassword, $this->clock->now());
        $this->users->save($domainUser);
    }
}
