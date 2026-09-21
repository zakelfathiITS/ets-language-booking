<?php

declare(strict_types=1);

namespace App\Tests\Support\InMemory;

use App\Domain\Identity\Email;
use App\Domain\Identity\Exception\EmailAlreadyInUse;
use App\Domain\Identity\User;
use App\Domain\Identity\UserId;
use App\Domain\Identity\UserRepository;

/**
 * Behaves like the MongoDB adapter, including the unique email constraint.
 */
final class InMemoryUserRepository implements UserRepository
{
    /** @var array<string, User> */
    private array $users = [];

    private int $sequence = 0;

    public function nextIdentity(): UserId
    {
        return UserId::fromString(sprintf('%024x', ++$this->sequence));
    }

    public function save(User $user): void
    {
        foreach ($this->users as $id => $existing) {
            if ($id !== $user->id()->value && $existing->email()->equals($user->email())) {
                throw EmailAlreadyInUse::forEmail($user->email());
            }
        }

        $this->users[$user->id()->value] = $user;
    }

    public function ofId(UserId $id): ?User
    {
        return $this->users[$id->value] ?? null;
    }

    public function ofEmail(Email $email): ?User
    {
        foreach ($this->users as $user) {
            if ($user->email()->equals($email)) {
                return $user;
            }
        }

        return null;
    }
}
