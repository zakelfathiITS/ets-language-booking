<?php

declare(strict_types=1);

namespace App\UI\Http\Request\Catalog;

use App\Domain\Catalog\Capacity;
use App\Domain\Catalog\TestSession;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Body of POST /api/sessions and PUT /api/sessions/{id}.
 *
 * Date and time are received separately, in the application timezone.
 */
#[OA\Schema(required: ['language', 'date', 'time', 'location', 'capacity'])]
final readonly class TestSessionRequest
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(min: TestSession::LANGUAGE_MIN_LENGTH, max: TestSession::LANGUAGE_MAX_LENGTH, normalizer: 'trim')]
        public string $language = '',
        #[Assert\NotBlank]
        #[Assert\Date(message: 'The date must be a valid date in the YYYY-MM-DD format.')]
        #[OA\Property(format: 'date', example: '2026-10-15')]
        public string $date = '',
        #[Assert\NotBlank]
        #[Assert\Regex(pattern: '/^([01]\d|2[0-3]):[0-5]\d$/', message: 'The time must follow the 24-hour HH:MM format.')]
        #[OA\Property(description: 'Local time (see the timezone of the API).', example: '09:30')]
        public string $time = '',
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(min: TestSession::LOCATION_MIN_LENGTH, max: TestSession::LOCATION_MAX_LENGTH, normalizer: 'trim')]
        public string $location = '',
        #[Assert\Range(min: Capacity::MIN, max: Capacity::MAX)]
        public int $capacity = 0,
    ) {
    }
}
