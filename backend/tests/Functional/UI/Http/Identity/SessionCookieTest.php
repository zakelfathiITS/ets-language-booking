<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Http\Identity;

use App\Tests\Support\ApiTestCase;
use Lexik\Bundle\JWTAuthenticationBundle\Encoder\JWTEncoderInterface;
use PHPUnit\Framework\Attributes\CoversNothing;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * The web client's session: an httpOnly cookie holding the JWT, revoked on sign-out.
 * Requests go over HTTPS, as the cookie is marked Secure.
 */
#[CoversNothing]
final class SessionCookieTest extends ApiTestCase
{
    private const API = 'https://localhost/api';

    protected function setUp(): void
    {
        parent::setUp();
        $this->client->disableReboot(); // one kernel, like one server: keeps the cookie jar meaningful
        $this->createUser('jane@example.com');
    }

    public function testLoginSetsTheTokenInACookieThatScriptsCannotRead(): void
    {
        $this->signIn();

        $cookie = $this->tokenCookie();
        self::assertNotNull($cookie);
        self::assertTrue($cookie->isHttpOnly());
        self::assertTrue($cookie->isSecure());
        self::assertSame(Cookie::SAMESITE_STRICT, $cookie->getSameSite());
        self::assertSame('/api', $cookie->getPath(), 'Only sent with API calls.');
        self::assertEqualsWithDelta(time() + 3600, $cookie->getExpiresTime(), 60);
    }

    public function testTheCookieAuthenticatesApiCalls(): void
    {
        $this->signIn();

        $data = $this->requestJson('GET', self::API.'/me');

        self::assertResponseIsSuccessful();
        self::assertSame('jane@example.com', $data['email']);
    }

    public function testSigningOutRevokesTheTokenAndClearsTheCookie(): void
    {
        $this->signIn();
        $token = (string) $this->tokenCookie()?->getValue();

        $this->requestJson('POST', self::API.'/auth/logout');

        self::assertResponseStatusCodeSame(204);
        $cleared = $this->tokenCookie();
        self::assertNotNull($cleared);
        self::assertTrue($cleared->isCleared());
        self::assertSame('/api', $cleared->getPath());

        // Even a copy of the token taken before signing out is now refused.
        $data = $this->requestJson('GET', self::API.'/me', token: $token);
        self::assertResponseStatusCodeSame(401);
        self::assertSame('token_invalid', $data['code']);
    }

    public function testSigningOutAlwaysSucceeds(): void
    {
        $this->requestJson('POST', self::API.'/auth/logout');
        self::assertResponseStatusCodeSame(204, 'Without a token.');

        $expired = self::getContainer()->get(JWTEncoderInterface::class)->encode(['sub' => 'x', 'exp' => time() - 60]);
        $this->requestJson('POST', self::API.'/auth/logout', token: $expired);
        self::assertResponseStatusCodeSame(204, 'With an expired token.');
    }

    public function testSigningOutOnlyAcceptsPost(): void
    {
        $this->signIn();

        $this->requestJson('GET', self::API.'/auth/logout');

        self::assertResponseStatusCodeSame(405);
        $this->requestJson('GET', self::API.'/me');
        self::assertResponseIsSuccessful('Still signed in.');
    }

    private function signIn(): void
    {
        $this->requestJson('POST', self::API.'/auth/login', ['email' => 'jane@example.com', 'password' => self::DEFAULT_PASSWORD]);
        self::assertResponseIsSuccessful();
    }
}
