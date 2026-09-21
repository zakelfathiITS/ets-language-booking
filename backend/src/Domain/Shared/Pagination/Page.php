<?php

declare(strict_types=1);

namespace App\Domain\Shared\Pagination;

/**
 * One page of results together with the total number of matching items.
 *
 * @template T
 */
final readonly class Page
{
    /**
     * @param list<T> $items
     */
    public function __construct(
        public array $items,
        public int $total,
        public PageRequest $request,
    ) {
        if ($total < 0) {
            throw new \InvalidArgumentException(sprintf('Total must not be negative, %d given.', $total));
        }
    }

    public function totalPages(): int
    {
        return (int) ceil($this->total / $this->request->limit);
    }

    public function hasNextPage(): bool
    {
        return $this->request->page < $this->totalPages();
    }

    public function hasPreviousPage(): bool
    {
        return $this->request->page > 1;
    }

    /**
     * @template U
     *
     * @param callable(T): U $mapper
     *
     * @return self<U>
     */
    public function map(callable $mapper): self
    {
        return new self(array_map($mapper, $this->items), $this->total, $this->request);
    }
}
