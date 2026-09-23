<?php

declare(strict_types=1);

namespace App\UI\Http\Security;

/**
 * Injects the id of the authenticated user into a string argument, so that
 * controllers state what they need without unwrapping a user object.
 *
 * Only for routes behind a firewall that authenticates the request.
 */
#[\Attribute(\Attribute::TARGET_PARAMETER)]
final class CurrentUserId
{
}
