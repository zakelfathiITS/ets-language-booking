<?php

declare(strict_types=1);

namespace App\Tests\Unit\UI\Http\EventListener;

use App\UI\Http\EventListener\ProxyClientIpListener;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

#[CoversClass(ProxyClientIpListener::class)]
final class ProxyClientIpListenerTest extends TestCase
{
    private const SECRET = 'shared-secret';

    public function testTheProxyCanForwardTheVisitorsAddress(): void
    {
        $request = $this->handle(new ProxyClientIpListener(self::SECRET), '203.0.113.7', self::SECRET);

        self::assertSame('203.0.113.7', $request->getClientIp());
    }

    public function testAForwardedAddressWithoutTheSecretIsIgnored(): void
    {
        $listener = new ProxyClientIpListener(self::SECRET);

        self::assertSame('10.0.0.2', $this->handle($listener, '203.0.113.7', 'guessed')->getClientIp());
        self::assertSame('10.0.0.2', $this->handle($listener, '203.0.113.7', null)->getClientIp());
    }

    public function testNothingIsTrustedWhenNoSecretIsConfigured(): void
    {
        $request = $this->handle(new ProxyClientIpListener(''), '203.0.113.7', '');

        self::assertSame('10.0.0.2', $request->getClientIp());
    }

    public function testAMalformedAddressIsIgnored(): void
    {
        $request = $this->handle(new ProxyClientIpListener(self::SECRET), 'not-an-ip', self::SECRET);

        self::assertSame('10.0.0.2', $request->getClientIp());
    }

    public function testTheSecretGoesNoFurther(): void
    {
        $request = $this->handle(new ProxyClientIpListener(self::SECRET), '203.0.113.7', self::SECRET);

        self::assertFalse($request->headers->has(ProxyClientIpListener::SECRET_HEADER));
    }

    private function handle(ProxyClientIpListener $listener, string $clientIp, ?string $secret): Request
    {
        $request = Request::create('/api/me', server: ['REMOTE_ADDR' => '10.0.0.2']);
        $request->headers->set(ProxyClientIpListener::CLIENT_IP_HEADER, $clientIp);
        if ($secret !== null) {
            $request->headers->set(ProxyClientIpListener::SECRET_HEADER, $secret);
        }

        $listener(new RequestEvent($this->createStub(HttpKernelInterface::class), $request, HttpKernelInterface::MAIN_REQUEST));

        return $request;
    }
}
