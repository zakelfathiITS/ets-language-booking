<?php

declare(strict_types=1);

namespace App\Tests\Support;

use App\Application\Catalog\CreateTestSession\CreateTestSessionCommand;
use App\Application\Catalog\CreateTestSession\CreateTestSessionHandler;
use App\Domain\Catalog\TestSession;
use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

/**
 * Creates sessions through the real use case, and shortcuts the states that
 * only other contexts (or time) can produce.
 */
trait CatalogFixtures
{
    protected function createSession(
        string $language = 'English',
        string $startsIn = '+10 days',
        int $capacity = 20,
        string $location = 'Paris – Test Center La Défense',
    ): string {
        $handler = static::getContainer()->get(CreateTestSessionHandler::class);

        return $handler(new CreateTestSessionCommand(
            $language,
            new \DateTimeImmutable($startsIn),
            $location,
            $capacity,
        ))->id;
    }

    protected function setSeatsTaken(string $sessionId, int $seatsTaken): void
    {
        $this->sessionCollection()->updateOne(['_id' => new ObjectId($sessionId)], ['$set' => ['seats_taken' => $seatsTaken]]);
    }

    protected function moveToThePast(string $sessionId): void
    {
        $this->sessionCollection()->updateOne(
            ['_id' => new ObjectId($sessionId)],
            ['$set' => ['scheduled_at' => new UTCDateTime(new \DateTimeImmutable('-2 days'))]],
        );
    }

    private function sessionCollection(): \MongoDB\Collection
    {
        $documentManager = static::getContainer()->get(DocumentManager::class);
        $documentManager->clear();

        return $documentManager->getDocumentCollection(TestSession::class);
    }
}
