<?php

declare(strict_types=1);

namespace App\UI\Http\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Defensive headers on every API response.
 *
 * JSON is never rendered by a browser, so it gets the strictest policy. The
 * only HTML page, Swagger UI, runs its bundled scripts and styles.
 */
#[AsEventListener(event: KernelEvents::RESPONSE, priority: -128)]
final class SecurityHeadersListener
{
    private const JSON_POLICY = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
    private const HTML_POLICY = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
        ."img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

    public function __invoke(ResponseEvent $event): void
    {
        $headers = $event->getResponse()->headers;
        $isHtml = str_starts_with((string) $headers->get('Content-Type'), 'text/html');

        $headers->set('Content-Security-Policy', $isHtml ? self::HTML_POLICY : self::JSON_POLICY);
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('X-Frame-Options', 'DENY');
        $headers->set('Referrer-Policy', 'no-referrer');
        $headers->set('Cross-Origin-Resource-Policy', 'same-origin');

        // Personal data must not be kept by browsers or shared caches.
        if (!$isHtml) {
            $headers->set('Cache-Control', 'no-store');
        }
    }
}
