<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\MongoDB\Repository;

use App\Domain\Catalog\Exception\CapacityBelowReservedSeats;
use App\Domain\Catalog\Exception\SessionHasReservations;
use App\Domain\Catalog\SessionCriteria;
use App\Domain\Catalog\TestSession;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Shared\Pagination\Page;
use App\Domain\Shared\Pagination\PageRequest;
use App\Infrastructure\Persistence\MongoDB\ObjectIds;
use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ODM\MongoDB\Query\Builder;
use Doctrine\ODM\MongoDB\UnitOfWork;
use MongoDB\BSON\ObjectId;
use MongoDB\Collection;

final class MongoTestSessionRepository implements TestSessionRepository
{
    public function __construct(private readonly DocumentManager $documentManager)
    {
    }

    public function nextIdentity(): TestSessionId
    {
        return TestSessionId::fromString((string) new ObjectId());
    }

    public function save(TestSession $session): void
    {
        if ($this->documentManager->getUnitOfWork()->getDocumentState($session) !== UnitOfWork::STATE_NEW) {
            $this->changeCapacityAtomically($session);
        }

        $this->documentManager->persist($session);
        $this->documentManager->flush();
    }

    /**
     * Deletes the session only if no seat is taken at this very moment: a
     * booking made since it was loaded would otherwise leave an orphan
     * reservation behind (bookings take their seat before being recorded).
     */
    public function remove(TestSession $session): void
    {
        $filter = ['_id' => new ObjectId($session->id()->value)];
        $deleted = $this->collection()->deleteOne($filter + ['seats_taken' => 0])->getDeletedCount();

        if ($deleted === 0 && ($current = $this->seatsTakenOf($session)) !== null) {
            $this->documentManager->refresh($session);

            throw SessionHasReservations::withSeatsTaken($current);
        }

        $this->documentManager->detach($session);
    }

    public function ofId(TestSessionId $id): ?TestSession
    {
        if (!ObjectIds::isValid($id->value)) {
            return null;
        }

        return $this->documentManager->find(TestSession::class, $id->value);
    }

    public function ofIds(array $ids): array
    {
        $values = array_values(array_filter(
            array_map(static fn (TestSessionId $id): string => $id->value, $ids),
            ObjectIds::isValid(...),
        ));

        if ($values === []) {
            return [];
        }

        $indexed = [];
        foreach ($this->documentManager->createQueryBuilder(TestSession::class)->field('id')->in($values)->getQuery()->toArray() as $session) {
            \assert($session instanceof TestSession);
            $indexed[$session->id()->value] = $session;
        }

        return $indexed;
    }

    public function search(SessionCriteria $criteria, PageRequest $pageRequest): Page
    {
        /** @var list<TestSession> $items */
        $items = array_values($this->filtered($criteria)
            ->sort(['scheduledAt' => 'asc', 'id' => 'asc'])
            ->skip($pageRequest->offset())
            ->limit($pageRequest->limit)
            ->getQuery()
            ->toArray());

        $total = $this->filtered($criteria)->count()->getQuery()->execute();
        \assert(\is_int($total));

        return new Page($items, $total, $pageRequest);
    }

    public function languagesOfSessionsStartingAfter(\DateTimeImmutable $moment): array
    {
        $languages = $this->documentManager->createQueryBuilder(TestSession::class)
            ->distinct('language')
            ->field('scheduledAt')->gt($moment)
            ->getQuery()
            ->execute();
        \assert(\is_array($languages));

        $languages = array_values(array_filter($languages, 'is_string'));
        sort($languages);

        return $languages;
    }

    /**
     * The aggregate checked the new capacity against the seats it knew of;
     * bookings made since then are only visible here. The capacity is therefore
     * written first, on condition that the seats taken at this very moment
     * still fit. The flush that follows writes it again, never the seat counter.
     */
    private function changeCapacityAtomically(TestSession $session): void
    {
        $capacity = $session->capacity()->seats;
        $changed = $this->collection()->updateOne(
            ['_id' => new ObjectId($session->id()->value), '$expr' => ['$lte' => ['$seats_taken', $capacity]]],
            ['$set' => ['capacity' => $capacity]],
        );

        if ($changed->getMatchedCount() === 0 && ($current = $this->seatsTakenOf($session)) !== null) {
            $this->documentManager->refresh($session);

            throw CapacityBelowReservedSeats::create($capacity, $current);
        }
    }

    /**
     * Seats taken right now, or null when the session no longer exists.
     */
    private function seatsTakenOf(TestSession $session): ?int
    {
        $stored = $this->collection()->findOne(
            ['_id' => new ObjectId($session->id()->value)],
            ['projection' => ['seats_taken' => 1]],
        );

        return \is_array($stored) ? (int) ($stored['seats_taken'] ?? 0) : null;
    }

    private function collection(): Collection
    {
        return $this->documentManager->getDocumentCollection(TestSession::class);
    }

    private function filtered(SessionCriteria $criteria): Builder
    {
        $builder = $this->documentManager->createQueryBuilder(TestSession::class);

        if ($criteria->language !== null) {
            $builder->field('language')->equals($criteria->language);
        }

        if ($criteria->startsAfter !== null) {
            $builder->field('scheduledAt')->gt($criteria->startsAfter);
        }

        if ($criteria->availableOnly) {
            // Compares two fields of the same document, server-side.
            $builder->addAnd(['$expr' => ['$lt' => ['$seats_taken', '$capacity']]]);
        }

        return $builder;
    }
}
