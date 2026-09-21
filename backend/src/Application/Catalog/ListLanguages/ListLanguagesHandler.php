<?php

declare(strict_types=1);

namespace App\Application\Catalog\ListLanguages;

use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Shared\Clock;

/**
 * Languages offered by upcoming sessions, e.g. to populate a filter.
 */
final readonly class ListLanguagesHandler
{
    public function __construct(
        private TestSessionRepository $sessions,
        private Clock $clock,
    ) {
    }

    /**
     * @return list<string>
     */
    public function __invoke(): array
    {
        return $this->sessions->languagesOfSessionsStartingAfter($this->clock->now());
    }
}
