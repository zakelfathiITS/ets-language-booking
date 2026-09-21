<?php

declare(strict_types=1);

namespace App\Application\Catalog\DeleteTestSession;

use App\Domain\Catalog\Exception\TestSessionNotFound;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Catalog\TestSessionRepository;

final readonly class DeleteTestSessionHandler
{
    public function __construct(private TestSessionRepository $sessions)
    {
    }

    public function __invoke(DeleteTestSessionCommand $command): void
    {
        $id = TestSessionId::fromString($command->sessionId);
        $session = $this->sessions->ofId($id) ?? throw TestSessionNotFound::withId($id);

        $session->ensureCanBeDeleted();
        $this->sessions->remove($session);
    }
}
