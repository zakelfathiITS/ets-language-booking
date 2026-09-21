<?php

declare(strict_types=1);

namespace App\Application\Catalog\ListTestSessions;

use App\Application\Catalog\TestSessionView;
use App\Domain\Catalog\SessionCriteria;
use App\Domain\Catalog\TestSession;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Shared\Clock;
use App\Domain\Shared\Pagination\Page;
use App\Domain\Shared\Pagination\PageRequest;

final readonly class ListTestSessionsHandler
{
    public function __construct(
        private TestSessionRepository $sessions,
        private Clock $clock,
    ) {
    }

    /**
     * @return Page<TestSessionView>
     */
    public function __invoke(ListTestSessionsQuery $query): Page
    {
        $now = $this->clock->now();
        $language = $query->language !== null && trim($query->language) !== ''
            ? TestSession::normalizeLanguage($query->language)
            : null;

        $page = $this->sessions->search(
            new SessionCriteria(
                language: $language,
                startsAfter: $query->includePast ? null : $now,
                availableOnly: $query->availableOnly,
            ),
            PageRequest::of($query->page, $query->limit),
        );

        return $page->map(static fn (TestSession $session): TestSessionView => TestSessionView::fromSession($session, $now));
    }
}
