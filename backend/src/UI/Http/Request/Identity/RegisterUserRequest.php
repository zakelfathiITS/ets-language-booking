<?php

declare(strict_types=1);

namespace App\UI\Http\Request\Identity;

use App\Domain\Identity\Email;
use App\Domain\Identity\User;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Body of POST /api/auth/register.
 *
 * Defaults turn a missing field into a readable 422 violation instead of a
 * deserialization error.
 */
#[OA\Schema(required: ['name', 'email', 'password'])]
final readonly class RegisterUserRequest
{
    /** OWASP ASVS 2.1.1: length matters more than composition rules. */
    public const PASSWORD_MIN_LENGTH = 12;

    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(min: User::NAME_MIN_LENGTH, max: User::NAME_MAX_LENGTH, normalizer: 'trim')]
        public string $name = '',
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Email]
        #[Assert\Length(max: Email::MAX_LENGTH)]
        public string $email = '',
        #[Assert\NotBlank]
        #[Assert\Length(min: self::PASSWORD_MIN_LENGTH, max: 4096)]
        // Rejects passwords found in known data breaches (Have I Been Pwned,
        // k-anonymity: only 5 characters of the SHA-1 hash leave the server).
        // Registration still works if the service cannot be reached.
        #[Assert\NotCompromisedPassword(skipOnError: true)]
        public string $password = '',
    ) {
    }
}
