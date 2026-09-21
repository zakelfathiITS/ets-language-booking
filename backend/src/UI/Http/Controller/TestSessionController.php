<?php

declare(strict_types=1);

namespace App\UI\Http\Controller;

use App\Application\Catalog\CreateTestSession\CreateTestSessionCommand;
use App\Application\Catalog\CreateTestSession\CreateTestSessionHandler;
use App\Application\Catalog\DeleteTestSession\DeleteTestSessionCommand;
use App\Application\Catalog\DeleteTestSession\DeleteTestSessionHandler;
use App\Application\Catalog\GetTestSession\GetTestSessionHandler;
use App\Application\Catalog\GetTestSession\GetTestSessionQuery;
use App\Application\Catalog\ListLanguages\ListLanguagesHandler;
use App\Application\Catalog\ListTestSessions\ListTestSessionsHandler;
use App\Application\Catalog\ListTestSessions\ListTestSessionsQuery;
use App\Application\Catalog\UpdateTestSession\UpdateTestSessionCommand;
use App\Application\Catalog\UpdateTestSession\UpdateTestSessionHandler;
use App\UI\Http\Request\Catalog\TestSessionRequest;
use App\UI\Http\Request\QueryParameters;
use App\UI\Http\Response\Catalog\TestSessionPresenter;
use App\UI\Http\Response\PaginatedResource;
use App\UI\Shared\ScheduleConverter;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Catalogue of test sessions: read by any authenticated user, written by administrators.
 */
#[AsController]
#[Route('/api/sessions', name: 'api_sessions_')]
final readonly class TestSessionController
{
    public const DEFAULT_LIMIT = 10;
    public const MAX_LIMIT = 50;

    public function __construct(
        private TestSessionPresenter $presenter,
        private ScheduleConverter $schedule,
    ) {
    }

    /**
     * Query string: page, limit (capped at 50), language, availableOnly, includePast.
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request, ListTestSessionsHandler $listSessions): JsonResponse
    {
        $page = $listSessions(new ListTestSessionsQuery(
            page: QueryParameters::positiveInt($request, 'page', 1),
            limit: min(self::MAX_LIMIT, QueryParameters::positiveInt($request, 'limit', self::DEFAULT_LIMIT)),
            language: QueryParameters::string($request, 'language'),
            availableOnly: QueryParameters::boolean($request, 'availableOnly'),
            includePast: QueryParameters::boolean($request, 'includePast'),
        ));

        return new JsonResponse(PaginatedResource::from($page, $this->presenter->present(...)));
    }

    #[Route('/languages', name: 'languages', methods: ['GET'], priority: 1)]
    public function languages(ListLanguagesHandler $listLanguages): JsonResponse
    {
        return new JsonResponse(['items' => $listLanguages()]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(string $id, GetTestSessionHandler $getSession): JsonResponse
    {
        return new JsonResponse($this->presenter->present($getSession(new GetTestSessionQuery($id))));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(
        #[MapRequestPayload]
        TestSessionRequest $request,
        CreateTestSessionHandler $createSession,
        UrlGeneratorInterface $urlGenerator,
    ): JsonResponse {
        $session = $createSession(new CreateTestSessionCommand(
            $request->language,
            $this->schedule->toInstant($request->date, $request->time),
            $request->location,
            $request->capacity,
        ));

        return new JsonResponse(
            $this->presenter->present($session),
            Response::HTTP_CREATED,
            ['Location' => $urlGenerator->generate('api_sessions_show', ['id' => $session->id])],
        );
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(
        string $id,
        #[MapRequestPayload]
        TestSessionRequest $request,
        UpdateTestSessionHandler $updateSession,
    ): JsonResponse {
        $session = $updateSession(new UpdateTestSessionCommand(
            $id,
            $request->language,
            $this->schedule->toInstant($request->date, $request->time),
            $request->location,
            $request->capacity,
        ));

        return new JsonResponse($this->presenter->present($session));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(string $id, DeleteTestSessionHandler $deleteSession): Response
    {
        $deleteSession(new DeleteTestSessionCommand($id));

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
