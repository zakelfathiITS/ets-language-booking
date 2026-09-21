<?php

declare(strict_types=1);

namespace App\Domain\Catalog\Exception;

use App\Domain\Catalog\TestSessionId;
use App\Domain\Shared\Exception\NotFoundException;

final class TestSessionNotFound extends NotFoundException
{
    public static function withId(TestSessionId $id): self
    {
        return new self(sprintf('Session "%s" does not exist.', $id));
    }

    public function errorCode(): string
    {
        return 'session_not_found';
    }
}
