<?php

declare(strict_types=1);

namespace App\UI\Http\Controller;

use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Liveness/readiness probe used by Docker healthchecks and hosting platforms.
 *
 * Reports "ok" only when MongoDB answers, so a healthy container is one that
 * can actually serve requests.
 */
#[AsController]
final class HealthController
{
    public function __construct(private readonly DocumentManager $documentManager)
    {
    }

    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $databaseUp = $this->pingDatabase();

        return new JsonResponse(
            [
                'status' => $databaseUp ? 'ok' : 'unavailable',
                'checks' => ['mongodb' => $databaseUp ? 'up' : 'down'],
            ],
            $databaseUp ? Response::HTTP_OK : Response::HTTP_SERVICE_UNAVAILABLE,
            ['Cache-Control' => 'no-store'],
        );
    }

    private function pingDatabase(): bool
    {
        try {
            $this->documentManager->getClient()->selectDatabase('admin')->command(['ping' => 1]);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
