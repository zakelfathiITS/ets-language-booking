<?php

declare(strict_types=1);

namespace App\Tests\Support\InMemory;

use App\Domain\Catalog\SessionCriteria;
use App\Domain\Catalog\TestSession;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Shared\Pagination\Page;
use App\Domain\Shared\Pagination\PageRequest;

final class InMemoryTestSessionRepository implements TestSessionRepository
{
    /** @var array<string, TestSession> */
    private array $sessions = [];

    private int $sequence = 0;

    public function nextIdentity(): TestSessionId
    {
        return TestSessionId::fromString(sprintf('%024x', ++$this->sequence));
    }

    public function save(TestSession $session): void
    {
        $this->sessions[$session->id()->value] = $session;
    }

    public function remove(TestSession $session): void
    {
        unset($this->sessions[$session->id()->value]);
    }

    public function ofId(TestSessionId $id): ?TestSession
    {
        return $this->sessions[$id->value] ?? null;
    }

    public function search(SessionCriteria $criteria, PageRequest $pageRequest): Page
    {
        $matching = array_values(array_filter(
            $this->sessions,
            static fn (TestSession $session): bool => ($criteria->language === null || $session->language() === $criteria->language)
                && ($criteria->startsAfter === null || $session->scheduledAt() > $criteria->startsAfter)
                && (!$criteria->availableOnly || !$session->isFull()),
        ));

        usort($matching, static fn (TestSession $a, TestSession $b): int => [$a->scheduledAt(), $a->id()->value] <=> [$b->scheduledAt(), $b->id()->value]);

        return new Page(
            \array_slice($matching, $pageRequest->offset(), $pageRequest->limit),
            \count($matching),
            $pageRequest,
        );
    }

    public function languagesOfSessionsStartingAfter(\DateTimeImmutable $moment): array
    {
        $languages = [];
        foreach ($this->sessions as $session) {
            if ($session->scheduledAt() > $moment) {
                $languages[$session->language()] = true;
            }
        }

        $languages = array_keys($languages);
        sort($languages);

        return $languages;
    }
}
