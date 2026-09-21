<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain\Shared\Pagination;

use App\Domain\Shared\Pagination\PageRequest;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(PageRequest::class)]
final class PageRequestTest extends TestCase
{
    public function testItComputesTheOffsetOfThePage(): void
    {
        self::assertSame(0, PageRequest::of(1, 10)->offset());
        self::assertSame(20, PageRequest::of(3, 10)->offset());
    }

    #[DataProvider('invalidValues')]
    public function testItRejectsNonPositiveValues(int $page, int $limit): void
    {
        $this->expectException(\InvalidArgumentException::class);

        PageRequest::of($page, $limit);
    }

    /**
     * @return iterable<string, array{int, int}>
     */
    public static function invalidValues(): iterable
    {
        yield 'page zero' => [0, 10];
        yield 'negative page' => [-1, 10];
        yield 'limit zero' => [1, 0];
        yield 'negative limit' => [1, -5];
    }
}
