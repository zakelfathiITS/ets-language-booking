<?php

declare(strict_types=1);

namespace App\Infrastructure\Security;

use App\Application\Identity\PasswordHasher;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactoryInterface;

/**
 * Hashes with the algorithm configured for SecurityUser in security.yaml, so
 * registration and login always agree.
 */
final readonly class SymfonyPasswordHasher implements PasswordHasher
{
    public function __construct(private PasswordHasherFactoryInterface $hasherFactory)
    {
    }

    public function hash(#[\SensitiveParameter] string $plainPassword): string
    {
        return $this->hasherFactory->getPasswordHasher(SecurityUser::class)->hash($plainPassword);
    }
}
