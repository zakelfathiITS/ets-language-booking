<?php

declare(strict_types=1);

namespace App\Application\Identity\GetProfile;

use App\Application\Identity\UserProfile;
use App\Domain\Identity\Exception\UserNotFound;
use App\Domain\Identity\UserId;
use App\Domain\Identity\UserRepository;

final readonly class GetProfileHandler
{
    public function __construct(private UserRepository $users)
    {
    }

    /**
     * @throws UserNotFound
     */
    public function __invoke(GetProfileQuery $query): UserProfile
    {
        $id = UserId::fromString($query->userId);

        $user = $this->users->ofId($id) ?? throw UserNotFound::withId($id);

        return UserProfile::fromUser($user);
    }
}
