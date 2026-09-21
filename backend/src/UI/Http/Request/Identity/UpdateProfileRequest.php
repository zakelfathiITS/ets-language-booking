<?php

declare(strict_types=1);

namespace App\UI\Http\Request\Identity;

use App\Domain\Identity\Email;
use App\Domain\Identity\User;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Body of PUT /api/me.
 */
final readonly class UpdateProfileRequest
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(min: User::NAME_MIN_LENGTH, max: User::NAME_MAX_LENGTH, normalizer: 'trim')]
        public string $name = '',
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Email]
        #[Assert\Length(max: Email::MAX_LENGTH)]
        public string $email = '',
    ) {
    }
}
