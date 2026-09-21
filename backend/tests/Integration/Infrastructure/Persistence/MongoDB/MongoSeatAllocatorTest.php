<?php

declare(strict_types=1);

namespace App\Tests\Integration\Infrastructure\Persistence\MongoDB;

use App\Domain\Catalog\Exception\SessionAlreadyStarted;
use App\Domain\Catalog\Exception\SessionFull;
use App\Domain\Catalog\Exception\TestSessionNotFound;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Catalog\TestSessionRepository;
use App\Infrastructure\Persistence\MongoDB\MongoSeatAllocator;
use App\Tests\Support\CatalogFixtures;
use App\Tests\Support\ResetsDatabase;
use Doctrine\ODM\MongoDB\DocumentManager;
use PHPUnit\Framework\Attributes\CoversClass;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

#[CoversClass(MongoSeatAllocator::class)]
final class MongoSeatAllocatorTest extends KernelTestCase
{
    use CatalogFixtures;
    use ResetsDatabase;

    private MongoSeatAllocator $allocator;
    private TestSessionRepository $sessions;

    protected function setUp(): void
    {
        self::bootKernel();
        self::resetDatabase();

        $this->allocator = new MongoSeatAllocator(self::getContainer()->get(DocumentManager::class));
        $this->sessions = self::getContainer()->get(TestSessionRepository::class);
    }

    public function testItTakesSeatsUntilTheSessionIsFull(): void
    {
        $id = TestSessionId::fromString($this->createSession(capacity: 2));

        $this->allocator->reserveSeat($id, new \DateTimeImmutable());
        $this->allocator->reserveSeat($id, new \DateTimeImmutable());

        self::assertSame(2, $this->sessions->ofId($id)?->seatsTaken());

        $this->expectException(SessionFull::class);
        $this->allocator->reserveSeat($id, new \DateTimeImmutable());
    }

    public function testASessionThatHasStartedIsNotBookable(): void
    {
        $id = $this->createSession();
        $this->moveToThePast($id);

        $this->expectException(SessionAlreadyStarted::class);

        $this->allocator->reserveSeat(TestSessionId::fromString($id), new \DateTimeImmutable());
    }

    public function testAnUnknownSessionIsReported(): void
    {
        $this->expectException(TestSessionNotFound::class);

        $this->allocator->reserveSeat(TestSessionId::fromString('ffffffffffffffffffffffff'), new \DateTimeImmutable());
    }

    public function testAMalformedIdIsReportedAsUnknown(): void
    {
        $this->expectException(TestSessionNotFound::class);

        $this->allocator->reserveSeat(TestSessionId::fromString('nope'), new \DateTimeImmutable());
    }

    public function testReleasingNeverMakesTheCounterNegative(): void
    {
        $id = TestSessionId::fromString($this->createSession());
        $this->allocator->reserveSeat($id, new \DateTimeImmutable());

        $this->allocator->releaseSeat($id);
        $this->allocator->releaseSeat($id);
        $this->allocator->releaseSeat(TestSessionId::fromString('nope'));

        self::assertSame(0, $this->sessions->ofId($id)?->seatsTaken());
    }

    public function testAnAlreadyLoadedSessionIsRefreshed(): void
    {
        $id = TestSessionId::fromString($this->createSession());
        $loaded = $this->sessions->ofId($id);
        self::assertNotNull($loaded);

        $this->allocator->reserveSeat($id, new \DateTimeImmutable());

        self::assertSame(1, $loaded->seatsTaken(), 'The in-memory copy must not stay stale.');
    }
}
