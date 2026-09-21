<?php

declare(strict_types=1);

namespace App\Application\Booking\ListReservedSessions;

use App\Domain\Booking\ReservationRepository;
use App\Domain\Identity\UserId;

/**
 * Which sessions a user has booked, so the catalogue can flag them (and offer
 * cancellation) without one request per session.
 */
final readonly class ListReservedSessionsHandler
{
    public function __construct(private ReservationRepository $reservations)
    {
    }

    /**
     * @return array<string, string> reservation id indexed by session id
     */
    public function __invoke(ListReservedSessionsQuery $query): array
    {
        $reserved = [];
        foreach ($this->reservations->ofUser(UserId::fromString($query->userId)) as $reservation) {
            $reserved[$reservation->sessionId()->value] = $reservation->id()->value;
        }

        return $reserved;
    }
}
