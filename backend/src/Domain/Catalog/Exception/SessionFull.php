<?php

declare(strict_types=1);

namespace App\Domain\Catalog\Exception;

use App\Domain\Catalog\TestSessionId;
use App\Domain\Shared\Exception\ConflictException;

final class SessionFull extends ConflictException
{
    public static function withId(TestSessionId $id): self
    {
        return new self(sprintf('Session "%s" has no seat left.', $id));
    }

    public function errorCode(): string
    {
        return 'session_full';
    }
}
