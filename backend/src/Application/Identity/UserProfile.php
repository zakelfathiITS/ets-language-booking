<?php

declare(strict_types=1);

namespace App\Application\Identity;

use App\Domain\Identity\Role;
use App\Domain\Identity\User;

/**
 * Read model of an account, safe to expose: it never carries the password hash.
 */
final readonly class UserProfile
{
    /**
     * @param list<string> $roles
     */
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public array $roles,
        public \DateTimeImmutable $createdAt,
    ) {
    }

    public static function fromUser(User $user): self
    {
        return new self(
            $user->id()->value,
            $user->name(),
            $user->email()->value,
            array_map(static fn (Role $role): string => $role->value, $user->roles()),
            $user->createdAt(),
        );
    }
}
