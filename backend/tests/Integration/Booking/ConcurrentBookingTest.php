<?php

declare(strict_types=1);

namespace App\Tests\Integration\Booking;

use App\Domain\Booking\Reservation;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Catalog\TestSessionRepository;
use App\Tests\Support\CatalogFixtures;
use App\Tests\Support\ResetsDatabase;
use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectId;
use PHPUnit\Framework\Attributes\CoversNothing;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Process\Process;

/**
 * Real concurrency: independent PHP processes book at the same moment, the
 * way simultaneous HTTP requests would be served.
 */
#[CoversNothing]
final class ConcurrentBookingTest extends KernelTestCase
{
    use CatalogFixtures;
    use ResetsDatabase;

    private const WORKER = __DIR__.'/../../Support/Concurrency/book-session.php';

    protected function setUp(): void
    {
        self::bootKernel();
        self::resetDatabase();
    }

    public function testConcurrentCandidatesNeverOversellASession(): void
    {
        $sessionId = $this->createSession(capacity: 5);
        $candidates = array_map(static fn (): string => (string) new ObjectId(), range(1, 20));

        $outcomes = $this->runConcurrently(array_map(
            static fn (string $candidate): array => [$candidate, $sessionId],
            $candidates,
        ));

        self::assertSame(5, $outcomes['booked'] ?? 0, 'Exactly the capacity is booked.');
        self::assertSame(15, $outcomes['session_full'] ?? 0, 'Everybody else is told the session is full.');
        self::assertSame(5, $this->seatsTaken($sessionId));
        self::assertSame(5, $this->reservationCount());
    }

    public function testConcurrentDuplicateRequestsBookOnlyOneSeat(): void
    {
        $sessionId = $this->createSession(capacity: 10);
        $candidate = (string) new ObjectId();

        $outcomes = $this->runConcurrently(array_fill(0, 10, [$candidate, $sessionId]));

        self::assertSame(1, $outcomes['booked'] ?? 0);
        self::assertSame(9, $outcomes['already_reserved'] ?? 0);
        self::assertSame(1, $this->reservationCount());
        self::assertSame(1, $this->seatsTaken($sessionId), 'Seats taken by refused duplicates are given back.');
    }

    /**
     * @param list<array{string, string}> $bookings user id and session id of each worker
     *
     * @return array<string, int> number of workers per outcome
     */
    private function runConcurrently(array $bookings): array
    {
        $env = ['APP_ENV' => 'test', 'APP_DEBUG' => '0', 'MONGODB_DB' => 'ets_booking_test'];

        $processes = array_map(
            static fn (array $booking): Process => new Process(['php', self::WORKER, ...$booking], env: $env, timeout: 60),
            $bookings,
        );
        array_walk($processes, static fn (Process $process) => $process->start());

        $outcomes = [];
        foreach ($processes as $process) {
            $process->wait();
            self::assertTrue($process->isSuccessful(), $process->getErrorOutput());
            $outcome = trim($process->getOutput());
            $outcomes[$outcome] = ($outcomes[$outcome] ?? 0) + 1;
        }

        return $outcomes;
    }

    private function seatsTaken(string $sessionId): int
    {
        self::getContainer()->get(DocumentManager::class)->clear();

        return self::getContainer()->get(TestSessionRepository::class)->ofId(TestSessionId::fromString($sessionId))?->seatsTaken() ?? -1;
    }

    private function reservationCount(): int
    {
        return self::getContainer()->get(DocumentManager::class)->getDocumentCollection(Reservation::class)->countDocuments();
    }
}
