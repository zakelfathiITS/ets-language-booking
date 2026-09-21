<?php

declare(strict_types=1);

namespace App\UI\Http\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Documents an error answer: an RFC 9457 Problem Details document.
 */
#[\Attribute(\Attribute::TARGET_CLASS | \Attribute::TARGET_METHOD | \Attribute::IS_REPEATABLE)]
final class ErrorResponse extends OA\Response
{
    public const BAD_REQUEST = 'Malformed request (invalid JSON or query parameter).';
    public const UNAUTHORIZED = 'Missing, invalid or expired token (`token_missing`, `token_invalid`, `token_expired`).';
    public const FORBIDDEN = 'Administrator role required (`forbidden`).';
    public const NOT_FOUND = 'Not found, or not visible to the current user.';
    public const VALIDATION_FAILED = 'Invalid payload (`validation_failed` with `violations`) or broken business rule.';
    public const TOO_MANY_REQUESTS = 'Rate limit reached (`too_many_requests`), see `Retry-After`.';

    public function __construct(int $status, string $description)
    {
        parent::__construct(
            response: $status,
            description: $description,
            content: new OA\MediaType(
                mediaType: 'application/problem+json',
                schema: new OA\Schema(ref: '#/components/schemas/Problem'),
            ),
        );
    }
}
