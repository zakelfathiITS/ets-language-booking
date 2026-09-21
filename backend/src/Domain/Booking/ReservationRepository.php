<?php

declare(strict_types=1);

namespace App\Domain\Booking;

use App\Domain\Booking\Exception\AlreadyReserved;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Identity\UserId;

interface ReservationRepository
{
    public function nextIdentity(): ReservationId;

    /**
     * @throws AlreadyReserved when the user already holds a reservation for the session
     */
    public function add(Reservation $reservation): void;

    public function remove(Reservation $reservation): void;

    public function ofId(ReservationId $id): ?Reservation;

    public function ofUserAndSession(UserId $userId, TestSessionId $sessionId): ?Reservation;

    /**
     * @return list<Reservation> most recent first
     */
    public function ofUser(UserId $userId): array;
}
