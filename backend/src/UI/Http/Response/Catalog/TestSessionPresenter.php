<?php

declare(strict_types=1);

namespace App\UI\Http\Response\Catalog;

use App\Application\Catalog\TestSessionView;
use App\UI\Shared\ScheduleConverter;

/**
 * JSON representation of a test session.
 *
 * "date" and "time" are ready to display (application timezone); "scheduledAt"
 * carries the same instant as ISO 8601 with its offset, for programmatic use.
 * "myReservationId" tells whether the current user booked the session.
 */
final readonly class TestSessionPresenter
{
    public function __construct(private ScheduleConverter $schedule)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function present(TestSessionView $session, ?string $myReservationId = null): array
    {
        return [
            'id' => $session->id,
            'language' => $session->language,
            'date' => $this->schedule->localDate($session->scheduledAt),
            'time' => $this->schedule->localTime($session->scheduledAt),
            'timezone' => $this->schedule->timezone(),
            'scheduledAt' => $this->schedule->localDateTime($session->scheduledAt),
            'location' => $session->location,
            'capacity' => $session->capacity,
            'seatsTaken' => $session->seatsTaken,
            'seatsAvailable' => $session->seatsAvailable,
            'isFull' => $session->isFull,
            'hasStarted' => $session->hasStarted,
            'myReservationId' => $myReservationId,
        ];
    }
}
