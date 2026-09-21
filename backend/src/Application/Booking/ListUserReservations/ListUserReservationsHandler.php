<?php

declare(strict_types=1);

namespace App\Application\Booking\ListUserReservations;

use App\Application\Booking\ReservationView;
use App\Application\Catalog\TestSessionView;
use App\Domain\Booking\Reservation;
use App\Domain\Booking\ReservationRepository;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Identity\UserId;
use App\Domain\Shared\Clock;

final readonly class ListUserReservationsHandler
{
    public function __construct(
        private ReservationRepository $reservations,
        private TestSessionRepository $sessions,
        private Clock $clock,
    ) {
    }

    /**
     * Upcoming sessions first (soonest first), then past ones (most recent first).
     *
     * @return list<ReservationView>
     */
    public function __invoke(ListUserReservationsQuery $query): array
    {
        $now = $this->clock->now();
        $reservations = $this->reservations->ofUser(UserId::fromString($query->userId));

        // One query for all sessions instead of one per reservation.
        $sessions = $this->sessions->ofIds(array_map(
            static fn (Reservation $reservation) => $reservation->sessionId(),
            $reservations,
        ));

        $views = [];
        foreach ($reservations as $reservation) {
            $session = $sessions[$reservation->sessionId()->value] ?? null;
            if ($session !== null) {
                $views[] = ReservationView::from($reservation, TestSessionView::fromSession($session, $now));
            }
        }

        usort($views, static function (ReservationView $a, ReservationView $b): int {
            if ($a->session->hasStarted !== $b->session->hasStarted) {
                return $a->session->hasStarted ? 1 : -1;
            }

            return $a->session->hasStarted
                ? $b->session->scheduledAt <=> $a->session->scheduledAt
                : $a->session->scheduledAt <=> $b->session->scheduledAt;
        });

        return $views;
    }
}
