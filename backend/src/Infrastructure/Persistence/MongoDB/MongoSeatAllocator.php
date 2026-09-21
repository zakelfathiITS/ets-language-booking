<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\MongoDB;

use App\Domain\Booking\SeatAllocator;
use App\Domain\Catalog\Exception\SessionAlreadyStarted;
use App\Domain\Catalog\Exception\SessionFull;
use App\Domain\Catalog\Exception\TestSessionNotFound;
use App\Domain\Catalog\TestSession;
use App\Domain\Catalog\TestSessionId;
use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;
use MongoDB\Collection;

/**
 * Atomic counterpart of TestSession::reserveSeat() / releaseSeat().
 *
 * A seat is taken with a single conditional update ("not started and not
 * full, then +1"): MongoDB applies it atomically on the document, so two
 * concurrent requests for the last seat cannot both succeed.
 */
final class MongoSeatAllocator implements SeatAllocator
{
    public function __construct(private readonly DocumentManager $documentManager)
    {
    }

    public function reserveSeat(TestSessionId $sessionId, \DateTimeImmutable $now): void
    {
        if (!ObjectIds::isValid($sessionId->value)) {
            throw TestSessionNotFound::withId($sessionId);
        }

        $taken = $this->sessions()->findOneAndUpdate(
            [
                '_id' => new ObjectId($sessionId->value),
                'scheduled_at' => ['$gt' => new UTCDateTime($now)],
                '$expr' => ['$lt' => ['$seats_taken', '$capacity']],
            ],
            ['$inc' => ['seats_taken' => 1]],
            ['projection' => ['_id' => 1]],
        );

        if ($taken === null) {
            throw $this->whyNoSeatIsAvailable($sessionId, $now);
        }

        $this->refreshLoadedSession($sessionId);
    }

    public function releaseSeat(TestSessionId $sessionId): void
    {
        if (!ObjectIds::isValid($sessionId->value)) {
            return;
        }

        // The condition keeps the counter from ever going negative.
        $this->sessions()->updateOne(
            ['_id' => new ObjectId($sessionId->value), 'seats_taken' => ['$gt' => 0]],
            ['$inc' => ['seats_taken' => -1]],
        );

        $this->refreshLoadedSession($sessionId);
    }

    /**
     * The update matched nothing: read the session once to report the right reason.
     */
    private function whyNoSeatIsAvailable(TestSessionId $sessionId, \DateTimeImmutable $now): \Throwable
    {
        $session = $this->sessions()->findOne(
            ['_id' => new ObjectId($sessionId->value)],
            ['projection' => ['scheduled_at' => 1]],
        );

        if (!\is_array($session)) {
            return TestSessionNotFound::withId($sessionId);
        }

        $scheduledAt = $session['scheduled_at'] ?? null;
        if ($scheduledAt instanceof UTCDateTime && $scheduledAt->toDateTime() <= $now) {
            return SessionAlreadyStarted::withId($sessionId);
        }

        return SessionFull::withId($sessionId);
    }

    /**
     * The counter was changed behind Doctrine's back: an already loaded copy of
     * the session is refreshed so that it is neither shown nor saved stale.
     */
    private function refreshLoadedSession(TestSessionId $sessionId): void
    {
        $loaded = $this->documentManager->getUnitOfWork()->tryGetById(
            $sessionId->value,
            $this->documentManager->getClassMetadata(TestSession::class),
        );

        if ($loaded instanceof TestSession) {
            $this->documentManager->refresh($loaded);
        }
    }

    private function sessions(): Collection
    {
        return $this->documentManager->getDocumentCollection(TestSession::class);
    }
}
