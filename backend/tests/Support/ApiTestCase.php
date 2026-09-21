<?php

declare(strict_types=1);

namespace App\Tests\Support;

use App\Application\Identity\RegisterUser\RegisterUserCommand;
use App\Application\Identity\RegisterUser\RegisterUserHandler;
use App\Domain\Identity\Email;
use App\Domain\Identity\Role;
use App\Domain\Identity\UserRepository;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Base class for HTTP tests: a clean database and JSON helpers.
 */
abstract class ApiTestCase extends WebTestCase
{
    use ResetsDatabase;

    protected const DEFAULT_PASSWORD = 'S3cure-passw0rd';

    protected KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        self::resetDatabase();

        // Login throttling state is persisted in a cache pool: start every test fresh.
        static::getContainer()->get('cache.rate_limiter')->clear();
    }

    /**
     * @param array<string, mixed>|null $body
     *
     * @return array<string, mixed>
     */
    protected function requestJson(string $method, string $uri, ?array $body = null, ?string $token = null): array
    {
        $server = ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'];
        if ($token !== null) {
            $server['HTTP_AUTHORIZATION'] = 'Bearer '.$token;
        }

        $this->client->request(
            $method,
            $uri,
            server: $server,
            content: $body === null ? null : json_encode($body, \JSON_THROW_ON_ERROR),
        );

        return $this->responseData();
    }

    /**
     * @return array<string, mixed>
     */
    protected function responseData(): array
    {
        $content = (string) $this->client->getResponse()->getContent();
        if ($content === '') {
            return [];
        }

        $data = json_decode($content, true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($data);

        return $data;
    }

    /**
     * Creates an account directly through the use case (no HTTP round trip).
     *
     * @param list<Role> $roles
     */
    protected function createUser(
        string $email = 'jane@example.com',
        string $name = 'Jane Doe',
        string $password = self::DEFAULT_PASSWORD,
        array $roles = [],
    ): string {
        $container = static::getContainer();
        $profile = $container->get(RegisterUserHandler::class)(new RegisterUserCommand($name, $email, $password));

        if ($roles !== []) {
            $users = $container->get(UserRepository::class);
            $user = $users->ofEmail(Email::fromString($email));
            self::assertNotNull($user);
            foreach ($roles as $role) {
                $user->grantRole($role, new \DateTimeImmutable());
            }
            $users->save($user);
        }

        return $profile->id;
    }

    protected function login(string $email = 'jane@example.com', string $password = self::DEFAULT_PASSWORD): string
    {
        $data = $this->requestJson('POST', '/api/auth/login', ['email' => $email, 'password' => $password]);
        self::assertResponseIsSuccessful();
        self::assertIsString($data['token'] ?? null);

        return $data['token'];
    }

    /**
     * @param list<Role> $roles
     */
    protected function createUserAndLogin(string $email = 'jane@example.com', array $roles = []): string
    {
        $this->createUser($email, roles: $roles);

        return $this->login($email);
    }
}
