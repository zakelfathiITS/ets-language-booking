<?php

declare(strict_types=1);

namespace App\UI\Http\Response\Booking;

use App\Application\Booking\ReservationView;
use App\UI\Http\Response\Catalog\TestSessionPresenter;
use App\UI\Shared\ScheduleConverter;

/**
 * JSON representation of a reservation, embedding the booked session.
 */
final readonly class ReservationPresenter
{
    public function __construct(
        private TestSessionPresenter $sessions,
        private ScheduleConverter $schedule,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function present(ReservationView $reservation): array
    {
        return [
            'id' => $reservation->id,
            'reservedAt' => $this->schedule->localDateTime($reservation->reservedAt),
            'canBeCancelled' => $reservation->canBeCancelled,
            'session' => $this->sessions->present($reservation->session, $reservation->id),
        ];
    }
}
