<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Http\Identity;

use App\Tests\Support\ApiTestCase;
use Lexik\Bundle\JWTAuthenticationBundle\Encoder\JWTEncoderInterface;
use PHPUnit\Framework\Attributes\CoversNothing;

#[CoversNothing]
final class AuthenticationTest extends ApiTestCase
{
    public function testRegistrationCreatesAnAccount(): void
    {
        $data = $this->requestJson('POST', '/api/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'Jane@Example.com',
            'password' => self::DEFAULT_PASSWORD,
        ]);

        self::assertResponseStatusCodeSame(201);
        self::assertResponseHeaderSame('Location', '/api/me');
        self::assertSame(['id', 'name', 'email', 'roles', 'createdAt'], array_keys($data));
        self::assertSame('jane@example.com', $data['email']);
        self::assertSame(['ROLE_USER'], $data['roles']);
    }

    public function testRegistrationReportsEveryInvalidField(): void
    {
        $data = $this->requestJson('POST', '/api/auth/register', [
            'name' => 'J',
            'email' => 'not-an-email',
            'password' => 'short',
        ]);

        self::assertResponseStatusCodeSame(422);
        self::assertResponseHeaderSame('Content-Type', 'application/problem+json');
        self::assertSame('validation_failed', $data['code']);
        self::assertIsArray($data['violations']);
        self::assertEqualsCanonicalizing(['name', 'email', 'password'], array_column($data['violations'], 'field'));
    }

    public function testPasswordsNeedAtLeastTwelveCharacters(): void
    {
        $data = $this->requestJson('POST', '/api/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'Elev3n-char',
        ]);

        self::assertResponseStatusCodeSame(422);
        self::assertIsArray($data['violations']);
        self::assertSame(['password'], array_column($data['violations'], 'field'));
    }

    public function testRegistrationTreatsMissingFieldsAsViolations(): void
    {
        $data = $this->requestJson('POST', '/api/auth/register', []);

        self::assertResponseStatusCodeSame(422);
        self::assertIsArray($data['violations']);
        self::assertEqualsCanonicalizing(['name', 'email', 'password'], array_unique(array_column($data['violations'], 'field')));
    }

    public function testAnEmailCannotBeRegisteredTwice(): void
    {
        $this->createUser('jane@example.com');

        $data = $this->requestJson('POST', '/api/auth/register', [
            'name' => 'Jane Again',
            'email' => 'JANE@example.com',
            'password' => self::DEFAULT_PASSWORD,
        ]);

        self::assertResponseStatusCodeSame(409);
        self::assertSame('email_already_in_use', $data['code']);
    }

    public function testLoginReturnsTheProfileButNotTheToken(): void
    {
        $this->createUser('jane@example.com');

        $data = $this->requestJson('POST', '/api/auth/login', [
            'email' => 'jane@example.com',
            'password' => self::DEFAULT_PASSWORD,
        ]);

        self::assertResponseIsSuccessful();
        self::assertSame(['user'], array_keys($data), 'The token only travels in its httpOnly cookie.');
        self::assertIsArray($data['user']);
        self::assertSame('jane@example.com', $data['user']['email']);
        self::assertArrayNotHasKey('password', $data['user']);
        self::assertCount(3, explode('.', (string) $this->tokenCookie()?->getValue()), 'A JWT has three segments.');
    }

    public function testTheTokenSubjectIsTheUserIdNotTheEmail(): void
    {
        $userId = $this->createUser('jane@example.com');
        $token = $this->login('jane@example.com');

        $payload = self::getContainer()->get(JWTEncoderInterface::class)->decode($token);

        self::assertSame($userId, $payload['sub']);
    }

    public function testAWrongPasswordAndAnUnknownEmailGetTheSameAnswer(): void
    {
        $this->createUser('jane@example.com');

        $wrongPassword = $this->requestJson('POST', '/api/auth/login', ['email' => 'jane@example.com', 'password' => 'wrong-password']);
        self::assertResponseStatusCodeSame(401);
        self::assertResponseHeaderSame('WWW-Authenticate', 'Bearer');

        $unknownEmail = $this->requestJson('POST', '/api/auth/login', ['email' => 'nobody@example.com', 'password' => 'wrong-password']);
        self::assertResponseStatusCodeSame(401);

        self::assertSame('invalid_credentials', $wrongPassword['code']);
        self::assertSame($wrongPassword, $unknownEmail);
    }

    public function testLoginIsThrottledAfterFiveFailedAttempts(): void
    {
        $this->client->disableReboot(); // keep the rate limiter state between requests
        $this->createUser('jane@example.com');

        for ($attempt = 1; $attempt <= 5; ++$attempt) {
            $this->requestJson('POST', '/api/auth/login', ['email' => 'jane@example.com', 'password' => 'wrong-password']);
            self::assertResponseStatusCodeSame(401, sprintf('Attempt %d should only be refused.', $attempt));
        }

        $data = $this->requestJson('POST', '/api/auth/login', ['email' => 'jane@example.com', 'password' => self::DEFAULT_PASSWORD]);

        self::assertResponseStatusCodeSame(429);
        self::assertSame('too_many_login_attempts', $data['code']);
    }

    public function testLoginOnlyAcceptsJson(): void
    {
        $this->client->request('POST', '/api/auth/login', ['email' => 'jane@example.com', 'password' => 'secret']);

        self::assertResponseStatusCodeSame(415);
        self::assertResponseHeaderSame('Content-Type', 'application/problem+json');
    }

    public function testAProtectedRouteRequiresAToken(): void
    {
        $data = $this->requestJson('GET', '/api/me');

        self::assertResponseStatusCodeSame(401);
        self::assertSame('token_missing', $data['code']);
    }

    public function testAForgedTokenIsRejected(): void
    {
        $data = $this->requestJson('GET', '/api/me', token: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjMifQ.forged-signature');

        self::assertResponseStatusCodeSame(401);
        self::assertSame('token_invalid', $data['code']);
    }

    public function testAnExpiredTokenIsRejectedWithADedicatedCode(): void
    {
        $userId = $this->createUser('jane@example.com');
        $expired = self::getContainer()->get(JWTEncoderInterface::class)->encode([
            'sub' => $userId,
            'iat' => time() - 7200,
            'exp' => time() - 3600,
        ]);

        $data = $this->requestJson('GET', '/api/me', token: $expired);

        self::assertResponseStatusCodeSame(401);
        self::assertSame('token_expired', $data['code']);
    }
}
