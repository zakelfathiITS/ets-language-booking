<?php

declare(strict_types=1);

namespace App\Domain\Booking;

use App\Domain\Catalog\TestSessionId;
use App\Domain\Identity\UserId;

/**
 * A seat booked by a user in a test session.
 *
 * Sessions and users are referenced by id only: each aggregate stays
 * independent and is loaded on its own.
 *
 * Not final: Doctrine generates lazy-loading proxies that extend persisted classes.
 */
class Reservation
{
    private string $id;
    private string $sessionId;
    private string $userId;
    private \DateTimeImmutable $reservedAt;

    private function __construct(ReservationId $id, TestSessionId $sessionId, UserId $userId, \DateTimeImmutable $reservedAt)
    {
        $this->id = $id->value;
        $this->sessionId = $sessionId->value;
        $this->userId = $userId->value;
        $this->reservedAt = $reservedAt;
    }

    public static function book(ReservationId $id, TestSessionId $sessionId, UserId $userId, \DateTimeImmutable $now): self
    {
        return new self($id, $sessionId, $userId, $now);
    }

    public function id(): ReservationId
    {
        return ReservationId::fromString($this->id);
    }

    public function sessionId(): TestSessionId
    {
        return TestSessionId::fromString($this->sessionId);
    }

    public function userId(): UserId
    {
        return UserId::fromString($this->userId);
    }

    public function reservedAt(): \DateTimeImmutable
    {
        return $this->reservedAt;
    }

    public function isOwnedBy(UserId $userId): bool
    {
        return $this->userId === $userId->value;
    }
}
