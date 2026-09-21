<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Http;

use App\UI\Http\Controller\HealthController;
use App\UI\Http\EventListener\ApiProblemListener;
use PHPUnit\Framework\Attributes\CoversClass;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

#[CoversClass(HealthController::class)]
#[CoversClass(ApiProblemListener::class)]
final class ApiContractTest extends WebTestCase
{
    public function testTheHealthEndpointReportsTheDatabaseAsUp(): void
    {
        $client = self::createClient();

        $client->request('GET', '/api/health');

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Content-Type', 'application/json');
        self::assertSame(
            ['status' => 'ok', 'checks' => ['mongodb' => 'up']],
            json_decode((string) $client->getResponse()->getContent(), true),
        );
    }

    public function testAnUnknownApiRouteAnswersWithAProblemDocument(): void
    {
        $client = self::createClient();

        $client->request('GET', '/api/does-not-exist');

        self::assertResponseStatusCodeSame(404);
        self::assertResponseHeaderSame('Content-Type', 'application/problem+json');
        $problem = json_decode((string) $client->getResponse()->getContent(), true);
        self::assertIsArray($problem);
        self::assertSame('not_found', $problem['code']);
        self::assertSame(404, $problem['status']);
    }

    public function testAWrongHttpMethodAnswersWith405AndTheAllowedMethods(): void
    {
        $client = self::createClient();

        $client->request('DELETE', '/api/health');

        self::assertResponseStatusCodeSame(405);
        self::assertResponseHeaderSame('Allow', 'GET');
        self::assertResponseHeaderSame('Content-Type', 'application/problem+json');
    }
}
