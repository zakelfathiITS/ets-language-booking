<?php

declare(strict_types=1);

namespace App\UI\Http\Response\Identity;

use App\Application\Identity\UserProfile;

/**
 * JSON representation of an account.
 */
final class UserProfileResource
{
    /**
     * @return array{id: string, name: string, email: string, roles: list<string>, createdAt: string}
     */
    public static function from(UserProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'name' => $profile->name,
            'email' => $profile->email,
            'roles' => $profile->roles,
            'createdAt' => $profile->createdAt->format(\DATE_ATOM),
        ];
    }
}
