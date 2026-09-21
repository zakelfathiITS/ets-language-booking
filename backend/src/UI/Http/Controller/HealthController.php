<?php

declare(strict_types=1);

namespace App\UI\Http\Controller;

use App\Application\Shared\Health\DatabaseHealthCheck;
use Nelmio\ApiDocBundle\Attribute\Security;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Liveness/readiness probe used by Docker healthchecks and hosting platforms.
 *
 * Reports "ok" only when the database answers, so a healthy container is one
 * that can actually serve requests.
 */
#[AsController]
final class HealthController
{
    public function __construct(private readonly DatabaseHealthCheck $database)
    {
    }

    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    #[OA\Get(summary: 'Report whether the API and its database are up', tags: ['Health'])]
    #[Security(name: null)]
    #[OA\Response(response: 200, description: 'API and database are up.')]
    #[OA\Response(response: 503, description: 'The database is unreachable.')]
    public function __invoke(): JsonResponse
    {
        $databaseUp = $this->database->isAvailable();

        return new JsonResponse(
            [
                'status' => $databaseUp ? 'ok' : 'unavailable',
                'checks' => ['mongodb' => $databaseUp ? 'up' : 'down'],
            ],
            $databaseUp ? Response::HTTP_OK : Response::HTTP_SERVICE_UNAVAILABLE,
            ['Cache-Control' => 'no-store'],
        );
    }
}
