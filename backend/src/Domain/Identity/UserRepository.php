<?php

declare(strict_types=1);

namespace App\Domain\Identity;

use App\Domain\Identity\Exception\EmailAlreadyInUse;

interface UserRepository
{
    public function nextIdentity(): UserId;

    /**
     * @throws EmailAlreadyInUse when another account already uses the email
     */
    public function save(User $user): void;

    public function ofId(UserId $id): ?User;

    public function ofEmail(Email $email): ?User;
}
