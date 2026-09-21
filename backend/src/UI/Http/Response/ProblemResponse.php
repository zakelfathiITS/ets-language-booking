<?php

declare(strict_types=1);

namespace App\UI\Http\Response;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Error response following RFC 9457 (Problem Details for HTTP APIs).
 *
 * Besides the standard members, it carries two extensions:
 *  - "code": a stable identifier clients can switch on (e.g. "session_full");
 *  - "violations": field-level errors when the request payload is invalid.
 */
final class ProblemResponse extends JsonResponse
{
    public const CONTENT_TYPE = 'application/problem+json';

    /**
     * @param list<array{field: string, message: string}> $violations
     * @param array<string, string>                       $headers
     */
    public function __construct(
        int $status,
        string $code,
        string $detail,
        array $violations = [],
        array $headers = [],
    ) {
        $problem = [
            'type' => 'about:blank',
            'title' => Response::$statusTexts[$status] ?? 'Error',
            'status' => $status,
            'code' => $code,
            'detail' => $detail,
        ];

        if ($violations !== []) {
            $problem['violations'] = $violations;
        }

        parent::__construct($problem, $status, ['Content-Type' => self::CONTENT_TYPE] + $headers);
    }
}
