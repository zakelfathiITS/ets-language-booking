<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\MongoDB\Repository;

use App\Domain\Identity\Email;
use App\Domain\Identity\Exception\EmailAlreadyInUse;
use App\Domain\Identity\User;
use App\Domain\Identity\UserId;
use App\Domain\Identity\UserRepository;
use App\Infrastructure\Persistence\MongoDB\DuplicateKey;
use App\Infrastructure\Persistence\MongoDB\ObjectIds;
use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectId;

final class MongoUserRepository implements UserRepository
{
    public function __construct(private readonly DocumentManager $documentManager)
    {
    }

    public function nextIdentity(): UserId
    {
        return UserId::fromString((string) new ObjectId());
    }

    public function save(User $user): void
    {
        $this->documentManager->persist($user);

        try {
            $this->documentManager->flush();
        } catch (\Throwable $exception) {
            if (!DuplicateKey::isViolation($exception)) {
                throw $exception;
            }

            // Only unique index besides _id: a concurrent request took the email first.
            $this->documentManager->detach($user);

            throw EmailAlreadyInUse::forEmail($user->email());
        }
    }

    public function ofId(UserId $id): ?User
    {
        if (!ObjectIds::isValid($id->value)) {
            return null;
        }

        return $this->documentManager->find(User::class, $id->value);
    }

    public function ofEmail(Email $email): ?User
    {
        return $this->documentManager->getRepository(User::class)->findOneBy(['email' => $email->value]);
    }
}
