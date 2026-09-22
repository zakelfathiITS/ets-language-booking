<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Http;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * The OpenAPI document is generated from code: a mistake in an attribute
 * only shows up at runtime, so its generation is part of the test suite.
 */
final class ApiDocumentationTest extends WebTestCase
{
    public function testTheOpenApiDocumentDescribesEveryEndpoint(): void
    {
        $client = self::createClient();

        $client->request('GET', '/api/doc.json');

        self::assertResponseIsSuccessful();
        $document = json_decode((string) $client->getResponse()->getContent(), true);
        self::assertIsArray($document);
        self::assertIsArray($document['paths']);
        self::assertEqualsCanonicalizing([
            '/api/health',
            '/api/auth/register',
            '/api/auth/login',
            '/api/auth/logout',
            '/api/me',
            '/api/sessions',
            '/api/sessions/languages',
            '/api/sessions/{id}',
            '/api/reservations',
            '/api/reservations/{id}',
        ], array_keys($document['paths']));
    }

    public function testTheInteractiveDocumentationIsPublic(): void
    {
        $client = self::createClient();

        $client->request('GET', '/api/doc');

        self::assertResponseIsSuccessful();
        self::assertStringContainsString('<title>ETS Language Test Booking API</title>', (string) $client->getResponse()->getContent());
    }

    public function testTheDocumentationPageOnlyLoadsFilesServedByTheApi(): void
    {
        $client = self::createClient();

        $crawler = $client->request('GET', '/api/doc');

        // Anything else would be blocked by the page's Content Security Policy.
        $sources = [
            ...$crawler->filterXPath('//script[@src]')->extract(['src']),
            ...$crawler->filterXPath('//link[@rel="stylesheet"]')->extract(['href']),
        ];
        self::assertNotEmpty($sources);
        foreach ($sources as $source) {
            self::assertStringStartsWith('/bundles/nelmioapidoc/', $source);
        }
    }
}
