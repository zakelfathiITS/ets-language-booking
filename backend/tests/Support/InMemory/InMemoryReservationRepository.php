<?php

declare(strict_types=1);

namespace App\Tests\Support\InMemory;

use App\Domain\Booking\Exception\AlreadyReserved;
use App\Domain\Booking\Reservation;
use App\Domain\Booking\ReservationId;
use App\Domain\Booking\ReservationRepository;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Identity\UserId;

/**
 * Behaves like the MongoDB adapter, including the unique (session, user) index.
 */
final class InMemoryReservationRepository implements ReservationRepository
{
    /** @var array<string, Reservation> */
    private array $reservations = [];

    private int $sequence = 0;

    public function nextIdentity(): ReservationId
    {
        return ReservationId::fromString(sprintf('%024x', ++$this->sequence));
    }

    public function add(Reservation $reservation): void
    {
        if ($this->ofUserAndSession($reservation->userId(), $reservation->sessionId()) !== null) {
            throw AlreadyReserved::forSession($reservation->sessionId());
        }

        $this->reservations[$reservation->id()->value] = $reservation;
    }

    public function remove(Reservation $reservation): void
    {
        unset($this->reservations[$reservation->id()->value]);
    }

    public function ofId(ReservationId $id): ?Reservation
    {
        return $this->reservations[$id->value] ?? null;
    }

    public function ofUserAndSession(UserId $userId, TestSessionId $sessionId): ?Reservation
    {
        foreach ($this->reservations as $reservation) {
            if ($reservation->isOwnedBy($userId) && $reservation->sessionId()->equals($sessionId)) {
                return $reservation;
            }
        }

        return null;
    }

    public function ofUser(UserId $userId): array
    {
        $owned = array_values(array_filter(
            $this->reservations,
            static fn (Reservation $reservation): bool => $reservation->isOwnedBy($userId),
        ));
        usort($owned, static fn (Reservation $a, Reservation $b): int => $b->reservedAt() <=> $a->reservedAt());

        return $owned;
    }
}
