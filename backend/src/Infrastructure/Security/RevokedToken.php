<?php

declare(strict_types=1);

namespace App\Infrastructure\Security;

/**
 * A signed-out JWT, identified by its "jti" claim. Kept until the token would
 * have expired anyway: MongoDB then deletes it (TTL index).
 *
 * Only written and counted through queries (see MongoBlockedTokenManager);
 * not final, as Doctrine generates proxies for every mapped class.
 */
class RevokedToken
{
    private string $id;

    private \DateTimeImmutable $expiresAt;
}
