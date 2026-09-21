<?php

declare(strict_types=1);

namespace App\UI\Http\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Event\LogoutEvent;

/**
 * Answers POST /api/auth/logout with 204 instead of Symfony's default redirect.
 *
 * The token itself is revoked by LexikJWT's blocklist, and its cookie cleared
 * by the "delete_cookies" option of the "logout" firewall.
 */
#[AsEventListener(event: LogoutEvent::class, priority: 65)]
final class LogoutResponseListener
{
    public function __invoke(LogoutEvent $event): void
    {
        $event->setResponse(new Response(status: Response::HTTP_NO_CONTENT));
    }
}
