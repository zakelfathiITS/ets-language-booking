<?php

declare(strict_types=1);

namespace App\Domain\Shared\Pagination;

/**
 * A validated request for one page of results.
 */
final readonly class PageRequest
{
    private function __construct(
        public int $page,
        public int $limit,
    ) {
    }

    /**
     * @throws \InvalidArgumentException when the page or the limit is not strictly positive
     */
    public static function of(int $page, int $limit): self
    {
        if ($page < 1) {
            throw new \InvalidArgumentException(sprintf('Page must be greater than or equal to 1, %d given.', $page));
        }

        if ($limit < 1) {
            throw new \InvalidArgumentException(sprintf('Limit must be greater than or equal to 1, %d given.', $limit));
        }

        return new self($page, $limit);
    }

    public function offset(): int
    {
        return ($this->page - 1) * $this->limit;
    }
}
