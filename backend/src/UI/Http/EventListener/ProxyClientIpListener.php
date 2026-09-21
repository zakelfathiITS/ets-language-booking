<?php

declare(strict_types=1);

namespace App\UI\Http\EventListener;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Browsers reach the API through the web client's proxy, so every request
 * comes from the proxy's address. The proxy forwards the visitor's address in
 * "X-Client-Ip", trusted only alongside the shared secret: rate limits then
 * apply per visitor, and nobody else can pick the address they are counted under.
 *
 * Runs before anything that reads the client address (rate limiters, firewall).
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: 512)]
final readonly class ProxyClientIpListener
{
    public const SECRET_HEADER = 'X-Proxy-Secret';
    public const CLIENT_IP_HEADER = 'X-Client-Ip';

    public function __construct(
        #[Autowire('%env(API_PROXY_SECRET)%')]
        private string $secret,
    ) {
    }

    public function __invoke(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $presented = (string) $request->headers->get(self::SECRET_HEADER, '');
        $clientIp = filter_var($request->headers->get(self::CLIENT_IP_HEADER), \FILTER_VALIDATE_IP);
        $request->headers->remove(self::SECRET_HEADER);

        if ($this->secret === '' || !hash_equals($this->secret, $presented) || $clientIp === false) {
            return;
        }

        $request->server->set('REMOTE_ADDR', $clientIp);
    }
}
