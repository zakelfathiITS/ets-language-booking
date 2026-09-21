<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain\Catalog;

use App\Domain\Catalog\Capacity;
use App\Domain\Catalog\Exception\CapacityBelowReservedSeats;
use App\Domain\Catalog\Exception\InvalidTestSession;
use App\Domain\Catalog\Exception\SessionAlreadyStarted;
use App\Domain\Catalog\Exception\SessionFull;
use App\Domain\Catalog\Exception\SessionHasReservations;
use App\Domain\Catalog\TestSession;
use App\Domain\Catalog\TestSessionId;
use App\Tests\Support\TestSessionState;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(TestSession::class)]
#[CoversClass(Capacity::class)]
#[CoversClass(InvalidTestSession::class)]
#[CoversClass(CapacityBelowReservedSeats::class)]
#[CoversClass(SessionHasReservations::class)]
#[CoversClass(SessionFull::class)]
#[CoversClass(SessionAlreadyStarted::class)]
final class TestSessionTest extends TestCase
{
    private const NOW = '2026-03-01 12:00:00';

    public function testSchedulingNormalisesTheDetailsAndStoresUtc(): void
    {
        $session = $this->schedule(
            language: '  english ',
            scheduledAt: new \DateTimeImmutable('2026-03-10 09:00:00', new \DateTimeZone('Europe/Paris')),
            location: '  Paris – La Défense ',
        );

        self::assertSame('English', $session->language());
        self::assertSame('Paris – La Défense', $session->location());
        self::assertSame('2026-03-10T08:00:00+00:00', $session->scheduledAt()->format(\DATE_ATOM));
        self::assertSame(20, $session->capacity()->seats);
        self::assertSame(20, $session->seatsAvailable());
        self::assertFalse($session->isFull());
    }

    public function testASessionCannotBeScheduledInThePast(): void
    {
        $this->expectExceptionObject(InvalidTestSession::notInTheFuture());

        $this->schedule(scheduledAt: new \DateTimeImmutable('2026-02-28 09:00:00'));
    }

    #[DataProvider('invalidDetails')]
    public function testItRejectsInvalidDetails(string $language, string $location, string $expectedCode): void
    {
        try {
            $this->schedule(language: $language, location: $location);
            self::fail('An invalid session was accepted.');
        } catch (InvalidTestSession $exception) {
            self::assertSame($expectedCode, $exception->errorCode());
        }
    }

    /**
     * @return iterable<string, array{string, string, string}>
     */
    public static function invalidDetails(): iterable
    {
        yield 'language too short' => ['E', 'Paris', 'invalid_language'];
        yield 'language too long' => [str_repeat('a', 61), 'Paris', 'invalid_language'];
        yield 'blank location' => ['English', '   ', 'invalid_location'];
        yield 'location too long' => ['English', str_repeat('a', 181), 'invalid_location'];
    }

    #[DataProvider('invalidCapacities')]
    public function testCapacityMustStayWithinBounds(int $seats): void
    {
        $this->expectException(InvalidTestSession::class);

        Capacity::of($seats);
    }

    /**
     * @return iterable<string, array{int}>
     */
    public static function invalidCapacities(): iterable
    {
        yield 'zero' => [0];
        yield 'negative' => [-3];
        yield 'above maximum' => [Capacity::MAX + 1];
    }

    public function testReschedulingUpdatesTheDetails(): void
    {
        $session = $this->schedule();
        $later = new \DateTimeImmutable('2026-03-02 08:00:00');

        $session->reschedule('French', new \DateTimeImmutable('2026-04-01 14:00:00'), 'Lyon', Capacity::of(30), $later);

        self::assertSame('French', $session->language());
        self::assertSame('Lyon', $session->location());
        self::assertSame(30, $session->capacity()->seats);
        self::assertEquals($later, $session->updatedAt());
    }

    public function testCapacityCannotDropBelowTheSeatsAlreadyBooked(): void
    {
        $session = TestSessionState::withSeatsTaken($this->schedule(), 12);

        $this->expectException(CapacityBelowReservedSeats::class);

        $session->reschedule('English', new \DateTimeImmutable('2026-03-10 09:00:00'), 'Paris', Capacity::of(10), new \DateTimeImmutable(self::NOW));
    }

    public function testASessionWithBookingsCannotBeDeleted(): void
    {
        $session = TestSessionState::withSeatsTaken($this->schedule(), 1);

        $this->expectException(SessionHasReservations::class);

        $session->ensureCanBeDeleted();
    }

    public function testAFullSessionHasNoSeatLeft(): void
    {
        $session = TestSessionState::withSeatsTaken($this->schedule(), 20);

        self::assertTrue($session->isFull());
        self::assertSame(0, $session->seatsAvailable());
    }

    public function testReservingASeatTakesItUntilTheSessionIsFull(): void
    {
        $session = TestSessionState::withSeatsTaken($this->schedule(), 19);
        $now = new \DateTimeImmutable(self::NOW);

        $session->reserveSeat($now);
        self::assertTrue($session->isFull());

        $this->expectException(SessionFull::class);
        $session->reserveSeat($now);
    }

    public function testASessionThatHasStartedCannotBeBooked(): void
    {
        $session = $this->schedule(scheduledAt: new \DateTimeImmutable('2026-03-10 09:00:00'));

        $this->expectException(SessionAlreadyStarted::class);

        $session->reserveSeat(new \DateTimeImmutable('2026-03-10 09:00:00'));
    }

    public function testReleasingASeatNeverGoesBelowZero(): void
    {
        $session = TestSessionState::withSeatsTaken($this->schedule(), 1);

        $session->releaseSeat();
        $session->releaseSeat();

        self::assertSame(0, $session->seatsTaken());
    }

    public function testItKnowsWhenItHasStarted(): void
    {
        $session = $this->schedule(scheduledAt: new \DateTimeImmutable('2026-03-10 09:00:00'));

        self::assertFalse($session->hasStarted(new \DateTimeImmutable('2026-03-10 08:59:59')));
        self::assertTrue($session->hasStarted(new \DateTimeImmutable('2026-03-10 09:00:00')));
    }

    private function schedule(
        string $language = 'English',
        ?\DateTimeImmutable $scheduledAt = null,
        string $location = 'Paris',
    ): TestSession {
        return TestSession::schedule(
            TestSessionId::fromString('65f000000000000000000001'),
            $language,
            $scheduledAt ?? new \DateTimeImmutable('2026-03-10 09:00:00'),
            $location,
            Capacity::of(20),
            new \DateTimeImmutable(self::NOW),
        );
    }
}
