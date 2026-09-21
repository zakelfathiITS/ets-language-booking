<?php

declare(strict_types=1);

namespace App\Tests\Integration\Infrastructure\Security;

use App\Infrastructure\Security\MongoBlockedTokenManager;
use App\Infrastructure\Security\RevokedToken;
use App\Tests\Support\FrozenClock;
use App\Tests\Support\ResetsDatabase;
use Doctrine\ODM\MongoDB\DocumentManager;
use Lexik\Bundle\JWTAuthenticationBundle\Exception\MissingClaimException;
use Lexik\Bundle\JWTAuthenticationBundle\Services\BlockedTokenManagerInterface;
use PHPUnit\Framework\Attributes\CoversClass;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

#[CoversClass(MongoBlockedTokenManager::class)]
final class MongoBlockedTokenManagerTest extends KernelTestCase
{
    use ResetsDatabase;

    private DocumentManager $documentManager;
    private MongoBlockedTokenManager $manager;
    private int $now;

    protected function setUp(): void
    {
        self::bootKernel();
        self::resetDatabase();

        $clock = new FrozenClock();
        $this->now = $clock->now()->getTimestamp();
        $this->documentManager = self::getContainer()->get(DocumentManager::class);
        $this->manager = new MongoBlockedTokenManager($this->documentManager, $clock);
    }

    public function testLexikUsesItInsteadOfACachePool(): void
    {
        self::getContainer()->get(BlockedTokenManagerInterface::class)->add(['jti' => 'token-a', 'exp' => time() + 3600]);

        self::assertSame(1, $this->documentManager->getDocumentCollection(RevokedToken::class)->countDocuments());
    }

    public function testARevokedTokenIsRecognisedByItsId(): void
    {
        self::assertTrue($this->manager->add(['jti' => 'token-a', 'exp' => $this->now + 3600]));

        self::assertTrue($this->manager->has(['jti' => 'token-a']));
        self::assertFalse($this->manager->has(['jti' => 'token-b']));
    }

    public function testRevokingTheSameTokenTwiceIsHarmless(): void
    {
        $this->manager->add(['jti' => 'token-a', 'exp' => $this->now + 3600]);
        $this->manager->add(['jti' => 'token-a', 'exp' => $this->now + 3600]);

        self::assertSame(1, $this->documentManager->getDocumentCollection(RevokedToken::class)->countDocuments());
    }

    public function testAnExpiredTokenIsNotWorthStoring(): void
    {
        self::assertFalse($this->manager->add(['jti' => 'token-a', 'exp' => $this->now - 1]));

        self::assertFalse($this->manager->has(['jti' => 'token-a']));
    }

    public function testARevocationCanBeLifted(): void
    {
        $this->manager->add(['jti' => 'token-a', 'exp' => $this->now + 3600]);

        $this->manager->remove(['jti' => 'token-a']);

        self::assertFalse($this->manager->has(['jti' => 'token-a']));
    }

    public function testTokensWithoutAnIdCannotBeRevoked(): void
    {
        $this->expectException(MissingClaimException::class);

        $this->manager->add(['exp' => $this->now + 3600]);
    }

    public function testMongoDbDeletesEntriesOnceTheTokenHasExpired(): void
    {
        $indexes = iterator_to_array($this->documentManager->getDocumentCollection(RevokedToken::class)->listIndexes());
        $ttl = array_values(array_filter($indexes, static fn ($index): bool => $index->getName() === 'ttl_revoked_tokens_expires_at'));

        self::assertCount(1, $ttl);
        self::assertSame(['expires_at' => 1], $ttl[0]->getKey());
        self::assertSame(0, $ttl[0]['expireAfterSeconds']);
    }
}
