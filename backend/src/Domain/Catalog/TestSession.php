<?php

declare(strict_types=1);

namespace App\Domain\Catalog;

use App\Domain\Catalog\Exception\CapacityBelowReservedSeats;
use App\Domain\Catalog\Exception\InvalidTestSession;
use App\Domain\Catalog\Exception\SessionAlreadyStarted;
use App\Domain\Catalog\Exception\SessionFull;
use App\Domain\Catalog\Exception\SessionHasReservations;

/**
 * A language test session: where, when and how many seats.
 *
 * reserveSeat() and releaseSeat() state the seat rules. In production, the
 * MongoDB seat allocator applies the very same rules as one atomic update, so
 * concurrent bookings cannot oversell the last seat.
 *
 * Not final: Doctrine generates lazy-loading proxies that extend persisted classes.
 */
class TestSession
{
    public const LANGUAGE_MIN_LENGTH = 2;
    public const LANGUAGE_MAX_LENGTH = 60;
    public const LOCATION_MIN_LENGTH = 2;
    public const LOCATION_MAX_LENGTH = 180;

    private string $id;
    private string $language;
    private \DateTimeImmutable $scheduledAt;
    private string $location;
    private int $capacity;
    private int $seatsTaken = 0;
    private \DateTimeImmutable $createdAt;
    private \DateTimeImmutable $updatedAt;

    private function __construct(TestSessionId $id, \DateTimeImmutable $now)
    {
        $this->id = $id->value;
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    /**
     * @throws InvalidTestSession when a detail is invalid or the date is not in the future
     */
    public static function schedule(
        TestSessionId $id,
        string $language,
        \DateTimeImmutable $scheduledAt,
        string $location,
        Capacity $capacity,
        \DateTimeImmutable $now,
    ): self {
        $session = new self($id, $now);
        $session->applyDetails($language, $scheduledAt, $location, $capacity, $now);

        return $session;
    }

    /**
     * @throws InvalidTestSession         when a detail is invalid or the date is not in the future
     * @throws CapacityBelowReservedSeats when seats already booked would no longer fit
     */
    public function reschedule(
        string $language,
        \DateTimeImmutable $scheduledAt,
        string $location,
        Capacity $capacity,
        \DateTimeImmutable $now,
    ): void {
        if ($capacity->seats < $this->seatsTaken) {
            throw CapacityBelowReservedSeats::create($capacity->seats, $this->seatsTaken);
        }

        $this->applyDetails($language, $scheduledAt, $location, $capacity, $now);
        $this->updatedAt = $now;
    }

    /**
     * @throws SessionAlreadyStarted
     * @throws SessionFull
     */
    public function reserveSeat(\DateTimeImmutable $now): void
    {
        $this->ensureBookingsCanChange($now);

        if ($this->isFull()) {
            throw SessionFull::withId($this->id());
        }

        ++$this->seatsTaken;
    }

    public function releaseSeat(): void
    {
        $this->seatsTaken = max(0, $this->seatsTaken - 1);
    }

    /**
     * @throws SessionAlreadyStarted
     */
    public function ensureBookingsCanChange(\DateTimeImmutable $now): void
    {
        if ($this->hasStarted($now)) {
            throw SessionAlreadyStarted::withId($this->id());
        }
    }

    /**
     * @throws SessionHasReservations
     */
    public function ensureCanBeDeleted(): void
    {
        if ($this->seatsTaken > 0) {
            throw SessionHasReservations::withSeatsTaken($this->seatsTaken);
        }
    }

    public function id(): TestSessionId
    {
        return TestSessionId::fromString($this->id);
    }

    public function language(): string
    {
        return $this->language;
    }

    public function scheduledAt(): \DateTimeImmutable
    {
        return $this->scheduledAt;
    }

    public function location(): string
    {
        return $this->location;
    }

    public function capacity(): Capacity
    {
        return Capacity::of($this->capacity);
    }

    public function seatsTaken(): int
    {
        return $this->seatsTaken;
    }

    public function seatsAvailable(): int
    {
        return max(0, $this->capacity - $this->seatsTaken);
    }

    public function isFull(): bool
    {
        return $this->seatsAvailable() === 0;
    }

    public function hasStarted(\DateTimeImmutable $now): bool
    {
        return $this->scheduledAt <= $now;
    }

    public function createdAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * "english", "ENGLISH" and " English " all become "English", so filtering
     * by language is an exact (indexable) match.
     */
    public static function normalizeLanguage(string $language): string
    {
        return mb_convert_case(trim($language), \MB_CASE_TITLE);
    }

    private function applyDetails(
        string $language,
        \DateTimeImmutable $scheduledAt,
        string $location,
        Capacity $capacity,
        \DateTimeImmutable $now,
    ): void {
        if ($scheduledAt <= $now) {
            throw InvalidTestSession::notInTheFuture();
        }

        $this->language = self::validText(
            self::normalizeLanguage($language),
            self::LANGUAGE_MIN_LENGTH,
            self::LANGUAGE_MAX_LENGTH,
            InvalidTestSession::languageLength(...),
        );
        $this->location = self::validText(
            trim($location),
            self::LOCATION_MIN_LENGTH,
            self::LOCATION_MAX_LENGTH,
            InvalidTestSession::locationLength(...),
        );
        $this->scheduledAt = $scheduledAt->setTimezone(new \DateTimeZone('UTC'));
        $this->capacity = $capacity->seats;
    }

    /**
     * @param callable(int, int): InvalidTestSession $error
     */
    private static function validText(string $value, int $min, int $max, callable $error): string
    {
        $length = mb_strlen($value);
        if ($length < $min || $length > $max) {
            throw $error($min, $max);
        }

        return $value;
    }
}
