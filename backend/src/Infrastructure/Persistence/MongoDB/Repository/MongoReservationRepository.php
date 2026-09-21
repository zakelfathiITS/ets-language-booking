<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\MongoDB\Repository;

use App\Domain\Booking\Exception\AlreadyReserved;
use App\Domain\Booking\Reservation;
use App\Domain\Booking\ReservationId;
use App\Domain\Booking\ReservationRepository;
use App\Domain\Catalog\TestSessionId;
use App\Domain\Identity\UserId;
use App\Infrastructure\Persistence\MongoDB\DuplicateKey;
use App\Infrastructure\Persistence\MongoDB\ObjectIds;
use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectId;

final class MongoReservationRepository implements ReservationRepository
{
    public function __construct(private readonly DocumentManager $documentManager)
    {
    }

    public function nextIdentity(): ReservationId
    {
        return ReservationId::fromString((string) new ObjectId());
    }

    public function add(Reservation $reservation): void
    {
        $this->documentManager->persist($reservation);

        try {
            $this->documentManager->flush();
        } catch (\Throwable $exception) {
            if (!DuplicateKey::isViolation($exception)) {
                throw $exception;
            }

            // The unique (session_id, user_id) index caught a concurrent duplicate.
            $this->documentManager->detach($reservation);

            throw AlreadyReserved::forSession($reservation->sessionId());
        }
    }

    public function remove(Reservation $reservation): void
    {
        $this->documentManager->remove($reservation);
        $this->documentManager->flush();
    }

    public function ofId(ReservationId $id): ?Reservation
    {
        if (!ObjectIds::isValid($id->value)) {
            return null;
        }

        return $this->documentManager->find(Reservation::class, $id->value);
    }

    public function ofUserAndSession(UserId $userId, TestSessionId $sessionId): ?Reservation
    {
        if (!ObjectIds::isValid($userId->value) || !ObjectIds::isValid($sessionId->value)) {
            return null;
        }

        return $this->documentManager->getRepository(Reservation::class)->findOneBy([
            'sessionId' => $sessionId->value,
            'userId' => $userId->value,
        ]);
    }

    public function ofUser(UserId $userId): array
    {
        if (!ObjectIds::isValid($userId->value)) {
            return [];
        }

        /** @var list<Reservation> $reservations */
        $reservations = array_values($this->documentManager->createQueryBuilder(Reservation::class)
            ->field('userId')->equals($userId->value)
            ->sort('reservedAt', 'desc')
            ->getQuery()
            ->toArray());

        return $reservations;
    }
}
