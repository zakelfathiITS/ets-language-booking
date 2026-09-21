<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\MongoDB\Repository;

use App\Domain\Catalog\SessionCriteria;
use App\Domain\Catalog\TestSession;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Catalog\TestSessionRepository;
use App\Domain\Shared\Pagination\Page;
use App\Domain\Shared\Pagination\PageRequest;
use App\Infrastructure\Persistence\MongoDB\ObjectIds;
use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ODM\MongoDB\Query\Builder;
use MongoDB\BSON\ObjectId;

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
        $this->documentManager->persist($session);
        $this->documentManager->flush();
    }

    public function remove(TestSession $session): void
    {
        $this->documentManager->remove($session);
        $this->documentManager->flush();
    }

    public function ofId(TestSessionId $id): ?TestSession
    {
        if (!ObjectIds::isValid($id->value)) {
            return null;
        }

        return $this->documentManager->find(TestSession::class, $id->value);
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
