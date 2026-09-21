<?php

declare(strict_types=1);

namespace App\Application\Catalog\ListTestSessions;

final readonly class ListTestSessionsQuery
{
    public function __construct(
        public int $page = 1,
        public int $limit = 10,
        public ?string $language = null,
        public bool $availableOnly = false,
        public bool $includePast = false,
    ) {
    }
}
