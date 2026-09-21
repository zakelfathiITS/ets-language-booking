<?php

declare(strict_types=1);

namespace App\UI\Http\Request\Booking;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Body of POST /api/reservations.
 */
#[OA\Schema(required: ['sessionId'])]
final readonly class BookSessionRequest
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        public string $sessionId = '',
    ) {
    }
}
