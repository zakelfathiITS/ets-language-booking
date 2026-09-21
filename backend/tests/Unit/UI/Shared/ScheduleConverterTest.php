<?php

declare(strict_types=1);

namespace App\Tests\Unit\UI\Shared;

use App\UI\Shared\ScheduleConverter;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

#[CoversClass(ScheduleConverter::class)]
final class ScheduleConverterTest extends TestCase
{
    private ScheduleConverter $converter;

    protected function setUp(): void
    {
        $this->converter = new ScheduleConverter('Europe/Paris');
    }

    public function testLocalDateAndTimeRoundTripThroughUtc(): void
    {
        $instant = $this->converter->toInstant('2026-07-14', '09:30');

        self::assertSame('2026-07-14T07:30:00+00:00', $instant->setTimezone(new \DateTimeZone('UTC'))->format(\DATE_ATOM));
        self::assertSame('2026-07-14', $this->converter->localDate($instant));
        self::assertSame('09:30', $this->converter->localTime($instant));
        self::assertSame('2026-07-14T09:30:00+02:00', $this->converter->localDateTime($instant));
        self::assertSame('Europe/Paris', $this->converter->timezone());
    }

    public function testWinterTimeUsesTheWinterOffset(): void
    {
        self::assertSame('2026-01-14T09:30:00+01:00', $this->converter->localDateTime($this->converter->toInstant('2026-01-14', '09:30')));
    }

    #[DataProvider('impossibleMoments')]
    public function testItRejectsMomentsThatDoNotExist(string $date, string $time): void
    {
        $this->expectException(UnprocessableEntityHttpException::class);

        $this->converter->toInstant($date, $time);
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function impossibleMoments(): iterable
    {
        yield 'February 30th' => ['2026-02-30', '09:00'];
        yield 'hour skipped by daylight saving' => ['2026-03-29', '02:30'];
        yield 'malformed' => ['14/07/2026', '9h30'];
    }
}
