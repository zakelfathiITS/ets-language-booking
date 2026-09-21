<?php

declare(strict_types=1);

namespace App\Application\Catalog\CreateTestSession;

use App\Application\Catalog\TestSessionView;
use App\Domain\Catalog\Capacity;
use App\Domain\Catalog\TestSession;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Shared\Clock;

final readonly class CreateTestSessionHandler
{
    public function __construct(
        private TestSessionRepository $sessions,
        private Clock $clock,
    ) {
    }

    public function __invoke(CreateTestSessionCommand $command): TestSessionView
    {
        $now = $this->clock->now();

        $session = TestSession::schedule(
            $this->sessions->nextIdentity(),
            $command->language,
            $command->scheduledAt,
            $command->location,
            Capacity::of($command->capacity),
            $now,
        );

        $this->sessions->save($session);

        return TestSessionView::fromSession($session, $now);
    }
}
