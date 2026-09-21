<?php

declare(strict_types=1);

namespace App\Infrastructure\Security;

use App\Domain\Shared\Clock;
use Doctrine\ODM\MongoDB\DocumentManager;
use Lexik\Bundle\JWTAuthenticationBundle\Exception\MissingClaimException;
use Lexik\Bundle\JWTAuthenticationBundle\Services\BlockedTokenManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\AsDecorator;

/**
 * Keeps revoked tokens in MongoDB rather than in a cache pool, which a
 * container restart would empty (and with it, every revocation).
 */
#[AsDecorator('lexik_jwt_authentication.blocked_token_manager')]
final readonly class MongoBlockedTokenManager implements BlockedTokenManagerInterface
{
    public function __construct(
        private DocumentManager $documentManager,
        private Clock $clock,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function add(array $payload): bool
    {
        $expiresAt = new \DateTimeImmutable('@'.self::claim($payload, 'exp'));
        if ($expiresAt <= $this->clock->now()) {
            return false;
        }

        // Upsert: signing out twice with the same token is not an error.
        $this->documentManager->createQueryBuilder(RevokedToken::class)
            ->updateOne()
            ->upsert()
            ->field('id')->equals(self::claim($payload, 'jti'))
            ->field('expiresAt')->set($expiresAt)
            ->getQuery()
            ->execute();

        return true;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function has(array $payload): bool
    {
        $count = $this->documentManager->createQueryBuilder(RevokedToken::class)
            ->count()
            ->field('id')->equals(self::claim($payload, 'jti'))
            ->getQuery()
            ->execute();

        return $count > 0;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function remove(array $payload): void
    {
        $this->documentManager->createQueryBuilder(RevokedToken::class)
            ->remove()
            ->field('id')->equals(self::claim($payload, 'jti'))
            ->getQuery()
            ->execute();
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function claim(array $payload, string $name): string
    {
        $value = $payload[$name] ?? null;
        if (!\is_string($value) && !\is_int($value)) {
            throw new MissingClaimException($name);
        }

        return (string) $value;
    }
}
