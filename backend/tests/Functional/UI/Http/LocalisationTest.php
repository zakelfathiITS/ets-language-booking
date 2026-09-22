<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Http;

use App\Domain\Identity\Role;
use App\Tests\Support\ApiTestCase;

/**
 * Validation messages follow the Accept-Language header sent by the client.
 */
final class LocalisationTest extends ApiTestCase
{
    public function testViolationsAreInFrenchWhenFrenchIsRequested(): void
    {
        $this->client->request('POST', '/api/auth/register', server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT_LANGUAGE' => 'fr-FR,fr;q=0.9,en;q=0.8',
        ], content: '{"name": "", "email": "nope", "password": "short"}');

        self::assertResponseStatusCodeSame(422);
        self::assertResponseHeaderSame('Content-Language', 'fr');
        $messages = $this->messagesByField($this->responseData());
        self::assertContains('Cette valeur ne doit pas être vide.', $messages['name'] ?? []);
        self::assertContains("Cette valeur n'est pas une adresse e-mail valide.", $messages['email'] ?? []);
    }

    public function testTheApplicationsOwnMessagesAreTranslatedToo(): void
    {
        $token = $this->createUserAndLogin('admin@example.com', [Role::Admin]);

        $this->client->request('POST', '/api/sessions', server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT_LANGUAGE' => 'fr',
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ], content: '{"language": "English", "date": "tomorrow", "time": "9h", "location": "Paris", "capacity": 10}');

        $messages = $this->messagesByField($this->responseData());
        self::assertContains("L'heure doit respecter le format 24 heures HH:MM.", $messages['time'] ?? []);
    }

    public function testEnglishIsTheDefault(): void
    {
        $data = $this->requestJson('POST', '/api/auth/register', ['name' => '']);

        self::assertResponseHeaderSame('Content-Language', 'en');
        self::assertContains('This value should not be blank.', $this->messagesByField($data)['name'] ?? []);
    }

    public function testAnUnsupportedLanguageFallsBackToEnglish(): void
    {
        $this->client->request('POST', '/api/auth/register', server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT_LANGUAGE' => 'de-DE',
        ], content: '{}');

        self::assertResponseHeaderSame('Content-Language', 'en');
    }

    /**
     * @param array<string, mixed> $problem
     *
     * @return array<string, list<string>> every message, grouped by field
     */
    private function messagesByField(array $problem): array
    {
        $messages = [];
        foreach (\is_array($problem['violations'] ?? null) ? $problem['violations'] : [] as $violation) {
            $messages[$violation['field']][] = $violation['message'];
        }

        return $messages;
    }
}
