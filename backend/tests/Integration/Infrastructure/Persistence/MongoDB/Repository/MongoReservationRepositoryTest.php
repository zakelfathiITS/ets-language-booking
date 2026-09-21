<?php

declare(strict_types=1);

namespace App\Tests\Integration\Infrastructure\Persistence\MongoDB\Repository;

use App\Domain\Booking\Exception\AlreadyReserved;
use App\Domain\Booking\Reservation;
use App\Domain\Booking\ReservationId;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Identity\UserId;
use App\Infrastructure\Persistence\MongoDB\Repository\MongoReservationRepository;
use App\Tests\Support\ResetsDatabase;
use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectId;
use PHPUnit\Framework\Attributes\CoversClass;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

#[CoversClass(MongoReservationRepository::class)]
final class MongoReservationRepositoryTest extends KernelTestCase
{
    use ResetsDatabase;

    private const SESSION = '65f0000000000000000000a1';
    private const OTHER_SESSION = '65f0000000000000000000a2';
    private const JANE = '65f0000000000000000000b1';
    private const JOHN = '65f0000000000000000000b2';

    private MongoReservationRepository $repository;
    private DocumentManager $documentManager;

    protected function setUp(): void
    {
        self::bootKernel();
        self::resetDatabase();

        $this->documentManager = self::getContainer()->get(DocumentManager::class);
        $this->repository = new MongoReservationRepository($this->documentManager);
    }

    public function testAReservationIsStoredWithObjectIdReferences(): void
    {
        $reservation = $this->reservation(self::SESSION, self::JANE, '2026-03-01 12:00:00');
        $this->repository->add($reservation);
        $this->documentManager->clear();

        $raw = $this->documentManager->getDocumentCollection(Reservation::class)->findOne();
        self::assertIsArray($raw);
        self::assertEqualsCanonicalizing(['_id', 'session_id', 'user_id', 'reserved_at'], array_keys($raw));
        self::assertEquals(new ObjectId(self::SESSION), $raw['session_id']);
        self::assertEquals(new ObjectId(self::JANE), $raw['user_id']);

        $loaded = $this->repository->ofId($reservation->id());
        self::assertNotNull($loaded);
        self::assertSame(self::SESSION, $loaded->sessionId()->value);
        self::assertSame(self::JANE, $loaded->userId()->value);
    }

    public function testTheUniqueIndexRejectsASecondBookingOfTheSameSession(): void
    {
        $this->repository->add($this->reservation(self::SESSION, self::JANE));

        $this->expectException(AlreadyReserved::class);

        // Bypasses the handler's pre-check, as a concurrent request would.
        $this->repository->add($this->reservation(self::SESSION, self::JANE));
    }

    public function testDifferentUsersCanBookTheSameSession(): void
    {
        $this->repository->add($this->reservation(self::SESSION, self::JANE));
        $this->repository->add($this->reservation(self::SESSION, self::JOHN));

        self::assertNotNull($this->repository->ofUserAndSession(UserId::fromString(self::JOHN), TestSessionId::fromString(self::SESSION)));
        self::assertNull($this->repository->ofUserAndSession(UserId::fromString(self::JOHN), TestSessionId::fromString(self::OTHER_SESSION)));
    }

    public function testItListsTheReservationsOfAUserMostRecentFirst(): void
    {
        $this->repository->add($this->reservation(self::SESSION, self::JANE, '2026-03-01 10:00:00'));
        $this->repository->add($this->reservation(self::OTHER_SESSION, self::JANE, '2026-03-02 10:00:00'));
        $this->repository->add($this->reservation(self::SESSION, self::JOHN));

        $sessions = array_map(
            static fn (Reservation $reservation): string => $reservation->sessionId()->value,
            $this->repository->ofUser(UserId::fromString(self::JANE)),
        );

        self::assertSame([self::OTHER_SESSION, self::SESSION], $sessions);
    }

    public function testItRemovesAReservation(): void
    {
        $reservation = $this->reservation(self::SESSION, self::JANE);
        $this->repository->add($reservation);

        $this->repository->remove($reservation);

        self::assertNull($this->repository->ofId($reservation->id()));
    }

    public function testMalformedIdsMatchNothing(): void
    {
        self::assertNull($this->repository->ofId(ReservationId::fromString('nope')));
        self::assertNull($this->repository->ofUserAndSession(UserId::fromString('nope'), TestSessionId::fromString(self::SESSION)));
        self::assertSame([], $this->repository->ofUser(UserId::fromString('nope')));
    }

    private function reservation(string $sessionId, string $userId, string $at = '2026-03-01 12:00:00'): Reservation
    {
        return Reservation::book(
            $this->repository->nextIdentity(),
            TestSessionId::fromString($sessionId),
            UserId::fromString($userId),
            new \DateTimeImmutable($at),
        );
    }
}
