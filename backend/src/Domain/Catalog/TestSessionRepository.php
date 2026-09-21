<?php

declare(strict_types=1);

namespace App\Domain\Catalog;

use App\Domain\Shared\Pagination\Page;
use App\Domain\Shared\Pagination\PageRequest;

interface TestSessionRepository
{
    public function nextIdentity(): TestSessionId;

    public function save(TestSession $session): void;

    public function remove(TestSession $session): void;

    public function ofId(TestSessionId $id): ?TestSession;

    /**
     * Loads several sessions in one round trip; unknown ids are ignored.
     *
     * @param list<TestSessionId> $ids
     *
     * @return array<string, TestSession> indexed by session id
     */
    public function ofIds(array $ids): array;

    /**
     * Sessions matching the criteria, soonest first.
     *
     * @return Page<TestSession>
     */
    public function search(SessionCriteria $criteria, PageRequest $pageRequest): Page;

    /**
     * Distinct languages of the sessions starting after the given moment, sorted alphabetically.
     *
     * @return list<string>
     */
    public function languagesOfSessionsStartingAfter(\DateTimeImmutable $moment): array;
}
