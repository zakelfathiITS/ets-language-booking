<?php

declare(strict_types=1);

namespace App\Application\Catalog\UpdateTestSession;

use App\Application\Catalog\TestSessionView;
use App\Domain\Catalog\Capacity;
use App\Domain\Catalog\Exception\TestSessionNotFound;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Shared\Clock;

final readonly class UpdateTestSessionHandler
{
    public function __construct(
        private TestSessionRepository $sessions,
        private Clock $clock,
    ) {
    }

    public function __invoke(UpdateTestSessionCommand $command): TestSessionView
    {
        $id = TestSessionId::fromString($command->sessionId);
        $session = $this->sessions->ofId($id) ?? throw TestSessionNotFound::withId($id);
        $now = $this->clock->now();

        $session->reschedule(
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
