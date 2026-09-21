<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain\Shared\Pagination;

use App\Domain\Shared\Pagination\Page;
use App\Domain\Shared\Pagination\PageRequest;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(Page::class)]
final class PageTest extends TestCase
{
    public function testItDescribesAMiddlePage(): void
    {
        $page = new Page(['a', 'b'], 25, PageRequest::of(2, 10));

        self::assertSame(3, $page->totalPages());
        self::assertTrue($page->hasNextPage());
        self::assertTrue($page->hasPreviousPage());
    }

    public function testTheLastPageHasNoNextPage(): void
    {
        $page = new Page(['a'], 21, PageRequest::of(3, 10));

        self::assertFalse($page->hasNextPage());
    }

    public function testAnEmptyResultHasNoPages(): void
    {
        $page = new Page([], 0, PageRequest::of(1, 10));

        self::assertSame(0, $page->totalPages());
        self::assertFalse($page->hasNextPage());
        self::assertFalse($page->hasPreviousPage());
    }

    public function testMappingKeepsThePaginationMetadata(): void
    {
        $page = new Page([1, 2], 12, PageRequest::of(1, 2));

        $mapped = $page->map(static fn (int $value): string => 'item-'.$value);

        self::assertSame(['item-1', 'item-2'], $mapped->items);
        self::assertSame(12, $mapped->total);
        self::assertSame($page->request, $mapped->request);
    }

    public function testItRejectsANegativeTotal(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        new Page([], -1, PageRequest::of(1, 10));
    }
}
