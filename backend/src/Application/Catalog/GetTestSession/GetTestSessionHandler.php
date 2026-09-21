<?php

declare(strict_types=1);

namespace App\Application\Catalog\GetTestSession;

use App\Application\Catalog\TestSessionView;
use App\Domain\Catalog\Exception\TestSessionNotFound;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Shared\Clock;

final readonly class GetTestSessionHandler
{
    public function __construct(
        private TestSessionRepository $sessions,
        private Clock $clock,
    ) {
    }

    public function __invoke(GetTestSessionQuery $query): TestSessionView
    {
        $id = TestSessionId::fromString($query->sessionId);
        $session = $this->sessions->ofId($id) ?? throw TestSessionNotFound::withId($id);

        return TestSessionView::fromSession($session, $this->clock->now());
    }
}
