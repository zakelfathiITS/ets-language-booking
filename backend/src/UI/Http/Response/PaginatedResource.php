<?php

declare(strict_types=1);

namespace App\UI\Http\Response;

use App\Domain\Shared\Pagination\Page;

/**
 * JSON envelope shared by every paginated collection.
 */
final class PaginatedResource
{
    /**
     * @template T
     *
     * @param Page<T>                           $page
     * @param callable(T): array<string, mixed> $present
     *
     * @return array{items: list<array<string, mixed>>, pagination: array{page: int, limit: int, totalItems: int, totalPages: int, hasNextPage: bool, hasPreviousPage: bool}}
     */
    public static function from(Page $page, callable $present): array
    {
        return [
            'items' => array_map($present, $page->items),
            'pagination' => [
                'page' => $page->request->page,
                'limit' => $page->request->limit,
                'totalItems' => $page->total,
                'totalPages' => $page->totalPages(),
                'hasNextPage' => $page->hasNextPage(),
                'hasPreviousPage' => $page->hasPreviousPage(),
            ],
        ];
    }
}
