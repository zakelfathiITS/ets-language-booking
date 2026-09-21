<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Http;

use App\Tests\Support\ApiTestCase;
use App\UI\Http\EventListener\ProxyClientIpListener;
use PHPUnit\Framework\Attributes\CoversNothing;

/**
 * Security headers, cross-origin policy and rate limits.
 */
#[CoversNothing]
final class SecurityTest extends ApiTestCase
{
    private const PROXY_SECRET = 'test_only_proxy_secret';

    protected function setUp(): void
    {
        parent::setUp();
        $this->client->disableReboot(); // keeps the rate limiter state between requests
    }

    public function testApiResponsesCarryDefensiveHeaders(): void
    {
        $this->requestJson('GET', '/api/health');

        self::assertResponseHeaderSame('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
        self::assertResponseHeaderSame('X-Content-Type-Options', 'nosniff');
        self::assertResponseHeaderSame('X-Frame-Options', 'DENY');
        self::assertResponseHeaderSame('Referrer-Policy', 'no-referrer');
        self::assertResponseHeaderSame('Cache-Control', 'no-store, private');
    }

    public function testTheDocumentationPageMayRunItsOwnScripts(): void
    {
        $this->client->request('GET', '/api/doc');

        self::assertResponseIsSuccessful();
        self::assertStringContainsString("script-src 'self'", (string) $this->client->getResponse()->headers->get('Content-Security-Policy'));
    }

    public function testOtherOriginsAreNotAllowedToCallTheApi(): void
    {
        $this->client->request('OPTIONS', '/api/sessions', server: [
            'HTTP_ORIGIN' => 'https://attacker.example',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
        ]);

        self::assertResponseNotHasHeader('Access-Control-Allow-Origin');
    }

    public function testRegistrationIsLimitedPerClient(): void
    {
        for ($i = 1; $i <= 10; ++$i) {
            $this->register("user{$i}@example.com");
            self::assertResponseStatusCodeSame(201);
        }

        $data = $this->register('one-too-many@example.com');

        self::assertResponseStatusCodeSame(429);
        self::assertSame('too_many_requests', $data['code']);
        self::assertGreaterThan(0, (int) $this->client->getResponse()->headers->get('Retry-After'));

        // Another visitor, forwarded by the web client's proxy, is not affected...
        $this->register('neighbour@example.com', clientIp: '203.0.113.7', secret: self::PROXY_SECRET);
        self::assertResponseStatusCodeSame(201);

        // ...but nobody can pose as another visitor without the proxy's secret.
        $this->register('impostor@example.com', clientIp: '203.0.113.8', secret: 'guessed');
        self::assertResponseStatusCodeSame(429);
    }

    public function testProfileUpdatesAreLimitedPerUser(): void
    {
        $token = $this->createUserAndLogin('jane@example.com');

        for ($i = 1; $i <= 10; ++$i) {
            $this->requestJson('PUT', '/api/me', ['name' => "Jane {$i}", 'email' => 'jane@example.com'], $token);
            self::assertResponseIsSuccessful();
        }

        $this->requestJson('PUT', '/api/me', ['name' => 'Jane 11', 'email' => 'jane@example.com'], $token);
        self::assertResponseStatusCodeSame(429);

        // Other users keep their own allowance.
        $other = $this->createUserAndLogin('john@example.com');
        $this->requestJson('PUT', '/api/me', ['name' => 'John', 'email' => 'john@example.com'], $other);
        self::assertResponseIsSuccessful();
    }

    public function testFailedLoginsAreLimitedPerAccountWhateverTheClient(): void
    {
        $this->createUser('jane@example.com');

        // Ten clients, one attempt each: no client reaches its own limit.
        for ($i = 1; $i <= 10; ++$i) {
            $this->loginFrom("198.51.100.{$i}", 'wrong-password');
            self::assertResponseStatusCodeSame(401);
        }

        $data = $this->loginFrom('198.51.100.99', self::DEFAULT_PASSWORD);

        self::assertResponseStatusCodeSame(429);
        self::assertSame('too_many_login_attempts', $data['code']);
        self::assertGreaterThan(0, (int) $this->client->getResponse()->headers->get('Retry-After'));
    }

    /**
     * @return array<string, mixed>
     */
    private function register(string $email, ?string $clientIp = null, ?string $secret = null): array
    {
        $headers = $clientIp === null ? [] : $this->proxyHeaders($clientIp, (string) $secret);
        $this->client->request('POST', '/api/auth/register', server: $headers + ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'name' => 'Some One',
            'email' => $email,
            'password' => self::DEFAULT_PASSWORD,
        ], \JSON_THROW_ON_ERROR));

        return $this->responseData();
    }

    /**
     * @return array<string, mixed>
     */
    private function loginFrom(string $clientIp, string $password): array
    {
        $this->client->request('POST', '/api/auth/login', server: $this->proxyHeaders($clientIp, self::PROXY_SECRET) + ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'jane@example.com',
            'password' => $password,
        ], \JSON_THROW_ON_ERROR));

        return $this->responseData();
    }

    /**
     * @return array<string, string>
     */
    private function proxyHeaders(string $clientIp, string $secret): array
    {
        return [
            'HTTP_'.strtoupper(str_replace('-', '_', ProxyClientIpListener::CLIENT_IP_HEADER)) => $clientIp,
            'HTTP_'.strtoupper(str_replace('-', '_', ProxyClientIpListener::SECRET_HEADER)) => $secret,
        ];
    }
}
