<?php

declare(strict_types=1);

namespace App\Application\Identity\RegisterUser;

use App\Application\Identity\PasswordHasher;
use App\Application\Identity\UserProfile;
use App\Domain\Identity\Email;
use App\Domain\Identity\Exception\EmailAlreadyInUse;
use App\Domain\Identity\User;
use App\Domain\Identity\UserRepository;
use App\Domain\Shared\Clock;

final readonly class RegisterUserHandler
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $passwordHasher,
        private Clock $clock,
    ) {
    }

    /**
     * @throws EmailAlreadyInUse
     */
    public function __invoke(RegisterUserCommand $command): UserProfile
    {
        $email = Email::fromString($command->email);

        // Friendly answer for the common case; the unique index covers concurrent sign-ups.
        if ($this->users->ofEmail($email) !== null) {
            throw EmailAlreadyInUse::forEmail($email);
        }

        $user = User::register(
            $this->users->nextIdentity(),
            $command->name,
            $email,
            $this->passwordHasher->hash($command->plainPassword),
            $this->clock->now(),
        );

        $this->users->save($user);

        return UserProfile::fromUser($user);
    }
}
