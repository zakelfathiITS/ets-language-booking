<?php

declare(strict_types=1);

namespace App\Domain\Catalog;

/**
 * Filters applied when searching the catalogue.
 */
final readonly class SessionCriteria
{
    public function __construct(
        public ?string $language = null,
        public ?\DateTimeImmutable $startsAfter = null,
        public bool $availableOnly = false,
    ) {
    }
}
