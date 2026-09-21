<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Http\Identity;

use App\Domain\Identity\User;
use App\Tests\Support\ApiTestCase;
use Doctrine\ODM\MongoDB\DocumentManager;
use PHPUnit\Framework\Attributes\CoversNothing;

#[CoversNothing]
final class MeTest extends ApiTestCase
{
    public function testItReturnsTheAuthenticatedUser(): void
    {
        $token = $this->createUserAndLogin('jane@example.com');

        $data = $this->requestJson('GET', '/api/me', token: $token);

        self::assertResponseIsSuccessful();
        self::assertSame('Jane Doe', $data['name']);
        self::assertSame('jane@example.com', $data['email']);
    }

    public function testItUpdatesNameAndEmail(): void
    {
        $token = $this->createUserAndLogin('jane@example.com');

        $data = $this->requestJson('PUT', '/api/me', ['name' => 'Jane Smith', 'email' => 'Jane.Smith@example.com'], $token);

        self::assertResponseIsSuccessful();
        self::assertSame('Jane Smith', $data['name']);
        self::assertSame('jane.smith@example.com', $data['email']);
        self::assertSame($data, $this->requestJson('GET', '/api/me', token: $token));
    }

    public function testTheTokenStaysValidAfterAnEmailChange(): void
    {
        $token = $this->createUserAndLogin('jane@example.com');
        $this->requestJson('PUT', '/api/me', ['name' => 'Jane Doe', 'email' => 'jane.new@example.com'], $token);

        $this->requestJson('GET', '/api/me', token: $token);
        self::assertResponseIsSuccessful();

        $this->requestJson('POST', '/api/auth/login', ['email' => 'jane@example.com', 'password' => self::DEFAULT_PASSWORD]);
        self::assertResponseStatusCodeSame(401, 'The previous email no longer signs in.');

        $this->login('jane.new@example.com');
    }

    public function testItRejectsInvalidData(): void
    {
        $token = $this->createUserAndLogin('jane@example.com');

        $data = $this->requestJson('PUT', '/api/me', ['name' => '', 'email' => 'nope'], $token);

        self::assertResponseStatusCodeSame(422);
        self::assertIsArray($data['violations']);
        self::assertEqualsCanonicalizing(['name', 'email'], array_unique(array_column($data['violations'], 'field')));
    }

    public function testItRefusesTheEmailOfAnotherAccount(): void
    {
        $this->createUser('john@example.com', 'John Doe');
        $token = $this->createUserAndLogin('jane@example.com');

        $data = $this->requestJson('PUT', '/api/me', ['name' => 'Jane Doe', 'email' => 'john@example.com'], $token);

        self::assertResponseStatusCodeSame(409);
        self::assertSame('email_already_in_use', $data['code']);
    }

    public function testATokenOfADeletedAccountIsRejected(): void
    {
        $token = $this->createUserAndLogin('jane@example.com');
        self::getContainer()->get(DocumentManager::class)->getDocumentCollection(User::class)->deleteMany([]);

        $data = $this->requestJson('GET', '/api/me', token: $token);

        self::assertResponseStatusCodeSame(401);
        self::assertSame('token_invalid', $data['code']);
    }
}
