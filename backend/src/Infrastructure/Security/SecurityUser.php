<?php

declare(strict_types=1);

namespace App\Infrastructure\Security;

use App\Domain\Identity\Role;
use App\Domain\Identity\User;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Adapter between the domain User and Symfony Security.
 *
 * The identifier is the user id, not the email: it becomes the JWT "sub"
 * claim, so a token stays valid when its owner changes email address.
 */
final class SecurityUser implements UserInterface, PasswordAuthenticatedUserInterface
{
    /**
     * @param non-empty-string $id
     * @param list<string>     $roles
     */
    private function __construct(
        private readonly string $id,
        private readonly string $passwordHash,
        private readonly array $roles,
    ) {
    }

    public static function fromUser(User $user): self
    {
        $id = $user->id()->value;
        \assert($id !== '');

        return new self(
            $id,
            $user->passwordHash(),
            array_map(static fn (Role $role): string => $role->value, $user->roles()),
        );
    }

    public function getUserIdentifier(): string
    {
        return $this->id;
    }

    public function getPassword(): string
    {
        return $this->passwordHash;
    }

    /**
     * @return list<string>
     */
    public function getRoles(): array
    {
        return $this->roles;
    }

    public function eraseCredentials(): void
    {
        // No plain-text credential is ever stored on this object.
    }
}
