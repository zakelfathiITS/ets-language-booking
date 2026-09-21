<?php

declare(strict_types=1);

namespace App\UI\Http\Request;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Strict readers for query-string parameters: a malformed value is a client
 * error (400), never silently replaced by a default.
 */
final class QueryParameters
{
    public static function positiveInt(Request $request, string $name, int $default): int
    {
        $raw = $request->query->get($name);
        if ($raw === null || $raw === '') {
            return $default;
        }

        $value = filter_var($raw, \FILTER_VALIDATE_INT);
        if ($value === false || $value < 1) {
            throw new BadRequestHttpException(sprintf('The "%s" query parameter must be a positive integer.', $name));
        }

        return $value;
    }

    public static function boolean(Request $request, string $name): bool
    {
        $raw = $request->query->get($name);
        if ($raw === null || $raw === '') {
            return false;
        }

        $value = filter_var($raw, \FILTER_VALIDATE_BOOL, \FILTER_NULL_ON_FAILURE);
        if ($value === null) {
            throw new BadRequestHttpException(sprintf('The "%s" query parameter must be a boolean (true/false, 1/0).', $name));
        }

        return $value;
    }

    public static function string(Request $request, string $name): ?string
    {
        $value = trim($request->query->getString($name));

        return $value !== '' ? $value : null;
    }
}
