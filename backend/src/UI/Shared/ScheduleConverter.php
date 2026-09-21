<?php

declare(strict_types=1);

namespace App\UI\Shared;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Converts between the local "date" + "time" used by people and the UTC
 * instants stored by the domain.
 */
final readonly class ScheduleConverter
{
    private \DateTimeZone $timezone;

    public function __construct(#[Autowire('%app.timezone%')] string $timezone)
    {
        $this->timezone = new \DateTimeZone($timezone);
    }

    public function timezone(): string
    {
        return $this->timezone->getName();
    }

    /**
     * @param string $date YYYY-MM-DD
     * @param string $time HH:MM (24h)
     */
    public function toInstant(string $date, string $time): \DateTimeImmutable
    {
        $local = sprintf('%s %s', $date, $time);
        $instant = \DateTimeImmutable::createFromFormat('!Y-m-d H:i', $local, $this->timezone);

        // Rejects impossible dates (e.g. 2026-02-30) and times skipped by daylight saving.
        if ($instant === false || $instant->format('Y-m-d H:i') !== $local) {
            throw new UnprocessableEntityHttpException(sprintf('"%s" is not a valid date and time in the %s timezone.', $local, $this->timezone->getName()));
        }

        return $instant;
    }

    public function localDate(\DateTimeImmutable $instant): string
    {
        return $instant->setTimezone($this->timezone)->format('Y-m-d');
    }

    public function localTime(\DateTimeImmutable $instant): string
    {
        return $instant->setTimezone($this->timezone)->format('H:i');
    }

    public function localDateTime(\DateTimeImmutable $instant): string
    {
        return $instant->setTimezone($this->timezone)->format(\DATE_ATOM);
    }
}
