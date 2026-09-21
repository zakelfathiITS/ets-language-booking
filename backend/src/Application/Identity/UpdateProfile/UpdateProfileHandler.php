<?php

declare(strict_types=1);

namespace App\Application\Identity\UpdateProfile;

use App\Application\Identity\UserProfile;
use App\Domain\Identity\Email;
use App\Domain\Identity\Exception\EmailAlreadyInUse;
use App\Domain\Identity\Exception\UserNotFound;
use App\Domain\Identity\UserId;
use App\Domain\Identity\UserRepository;
use App\Domain\Shared\Clock;

final readonly class UpdateProfileHandler
{
    public function __construct(
        private UserRepository $users,
        private Clock $clock,
    ) {
    }

    /**
     * @throws UserNotFound
     * @throws EmailAlreadyInUse
     */
    public function __invoke(UpdateProfileCommand $command): UserProfile
    {
        $id = UserId::fromString($command->userId);
        $user = $this->users->ofId($id) ?? throw UserNotFound::withId($id);
        $email = Email::fromString($command->email);

        // Keeping one's own email must not be reported as a conflict.
        $owner = $this->users->ofEmail($email);
        if ($owner !== null && !$owner->id()->equals($id)) {
            throw EmailAlreadyInUse::forEmail($email);
        }

        $user->updateProfile($command->name, $email, $this->clock->now());
        $this->users->save($user);

        return UserProfile::fromUser($user);
    }
}
