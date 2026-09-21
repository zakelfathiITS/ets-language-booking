<?php

declare(strict_types=1);

namespace App\Tests\Integration\Infrastructure\Persistence\MongoDB\Repository;

use App\Domain\Identity\Email;
use App\Domain\Identity\Exception\EmailAlreadyInUse;
use App\Domain\Identity\Role;
use App\Domain\Identity\User;
use App\Domain\Identity\UserId;
use App\Infrastructure\Persistence\MongoDB\DuplicateKey;
use App\Infrastructure\Persistence\MongoDB\ObjectIds;
use App\Infrastructure\Persistence\MongoDB\Repository\MongoUserRepository;
use App\Tests\Support\ResetsDatabase;
use Doctrine\ODM\MongoDB\DocumentManager;
use PHPUnit\Framework\Attributes\CoversClass;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

#[CoversClass(MongoUserRepository::class)]
#[CoversClass(DuplicateKey::class)]
#[CoversClass(ObjectIds::class)]
final class MongoUserRepositoryTest extends KernelTestCase
{
    use ResetsDatabase;

    private MongoUserRepository $repository;
    private DocumentManager $documentManager;

    protected function setUp(): void
    {
        self::bootKernel();
        self::resetDatabase();

        $this->documentManager = self::getContainer()->get(DocumentManager::class);
        $this->repository = new MongoUserRepository($this->documentManager);
    }

    public function testItGeneratesObjectIdIdentities(): void
    {
        $id = $this->repository->nextIdentity();

        self::assertTrue(ObjectIds::isValid($id->value));
        self::assertFalse($id->equals($this->repository->nextIdentity()));
    }

    public function testAUserSurvivesARoundTripThroughMongoDb(): void
    {
        $user = $this->newUser('jane@example.com');
        $user->grantRole(Role::Admin, new \DateTimeImmutable('2026-01-16 09:00:00'));
        $this->repository->save($user);
        $this->documentManager->clear();

        $loaded = $this->repository->ofId($user->id());

        self::assertNotNull($loaded);
        self::assertNotSame($user, $loaded);
        self::assertSame('Jane Doe', $loaded->name());
        self::assertSame('jane@example.com', $loaded->email()->value);
        self::assertSame('hash', $loaded->passwordHash());
        self::assertSame([Role::User, Role::Admin], $loaded->roles());
        self::assertEquals(new \DateTimeImmutable('2026-01-15 10:00:00'), $loaded->createdAt());
    }

    public function testItStoresTheDocumentWithTheExpectedFieldNames(): void
    {
        $user = $this->newUser('jane@example.com');
        $this->repository->save($user);

        $raw = $this->documentManager->getDocumentCollection(User::class)->findOne();

        self::assertIsArray($raw);
        self::assertEqualsCanonicalizing(
            ['_id', 'name', 'email', 'password', 'roles', 'created_at', 'updated_at'],
            array_keys($raw),
        );
    }

    public function testItFindsAUserByEmail(): void
    {
        $this->repository->save($this->newUser('jane@example.com'));

        self::assertNotNull($this->repository->ofEmail(Email::fromString('JANE@example.com')));
        self::assertNull($this->repository->ofEmail(Email::fromString('nobody@example.com')));
    }

    public function testAMalformedIdMatchesNoUser(): void
    {
        self::assertNull($this->repository->ofId(UserId::fromString('not-an-object-id')));
    }

    public function testTheUniqueIndexRejectsADuplicateEmail(): void
    {
        $this->repository->save($this->newUser('jane@example.com'));

        $this->expectException(EmailAlreadyInUse::class);

        // Bypasses the handler's pre-check, as a concurrent request would.
        $this->repository->save($this->newUser('jane@example.com'));
    }

    private function newUser(string $email): User
    {
        return User::register(
            $this->repository->nextIdentity(),
            'Jane Doe',
            Email::fromString($email),
            'hash',
            new \DateTimeImmutable('2026-01-15 10:00:00'),
        );
    }
}
