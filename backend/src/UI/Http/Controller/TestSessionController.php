<?php

declare(strict_types=1);

namespace App\UI\Http\Controller;

use App\Application\Booking\ListReservedSessions\ListReservedSessionsHandler;
use App\Application\Booking\ListReservedSessions\ListReservedSessionsQuery;
use App\Application\Catalog\CreateTestSession\CreateTestSessionCommand;
use App\Application\Catalog\CreateTestSession\CreateTestSessionHandler;
use App\Application\Catalog\DeleteTestSession\DeleteTestSessionCommand;
use App\Application\Catalog\DeleteTestSession\DeleteTestSessionHandler;
use App\Application\Catalog\GetTestSession\GetTestSessionHandler;
use App\Application\Catalog\GetTestSession\GetTestSessionQuery;
use App\Application\Catalog\ListLanguages\ListLanguagesHandler;
use App\Application\Catalog\ListTestSessions\ListTestSessionsHandler;
use App\Application\Catalog\ListTestSessions\ListTestSessionsQuery;
use App\Application\Catalog\TestSessionView;
use App\Application\Catalog\UpdateTestSession\UpdateTestSessionCommand;
use App\Application\Catalog\UpdateTestSession\UpdateTestSessionHandler;
use App\UI\Http\OpenApi\ErrorResponse;
use App\UI\Http\Request\Catalog\TestSessionRequest;
use App\UI\Http\Request\QueryParameters;
use App\UI\Http\Response\Catalog\TestSessionPresenter;
use App\UI\Http\Response\PaginatedResource;
use App\UI\Shared\ScheduleConverter;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Catalogue of test sessions: read by any authenticated user, written by administrators.
 */
#[AsController]
#[Route('/api/sessions', name: 'api_sessions_')]
#[OA\Tag(name: 'Sessions')]
#[ErrorResponse(401, ErrorResponse::UNAUTHORIZED)]
final readonly class TestSessionController
{
    public const DEFAULT_LIMIT = 10;
    public const MAX_LIMIT = 50;

    public function __construct(
        private TestSessionPresenter $presenter,
        private ScheduleConverter $schedule,
        private ListReservedSessionsHandler $reservedSessions,
    ) {
    }

    /**
     * Query string: page, limit (capped at 50), language, availableOnly, includePast.
     */
    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(summary: 'List test sessions (upcoming first, paginated)')]
    #[OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1))]
    #[OA\Parameter(name: 'limit', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 50, default: 10))]
    #[OA\Parameter(name: 'language', in: 'query', description: 'Case-insensitive, e.g. "english".', schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'availableOnly', in: 'query', description: 'Hide full sessions.', schema: new OA\Schema(type: 'boolean', default: false))]
    #[OA\Parameter(name: 'includePast', in: 'query', description: 'Include sessions that have started.', schema: new OA\Schema(type: 'boolean', default: false))]
    #[OA\Response(response: 200, description: 'One page of sessions.', content: new OA\JsonContent(ref: '#/components/schemas/TestSessionPage'))]
    #[ErrorResponse(400, ErrorResponse::BAD_REQUEST)]
    public function list(
        Request $request,
        ListTestSessionsHandler $listSessions,
        #[CurrentUser]
        UserInterface $user,
    ): JsonResponse {
        $page = $listSessions(new ListTestSessionsQuery(
            page: QueryParameters::positiveInt($request, 'page', 1),
            limit: min(self::MAX_LIMIT, QueryParameters::positiveInt($request, 'limit', self::DEFAULT_LIMIT)),
            language: QueryParameters::string($request, 'language'),
            availableOnly: QueryParameters::boolean($request, 'availableOnly'),
            includePast: QueryParameters::boolean($request, 'includePast'),
        ));

        $reserved = $this->reservedSessionsOf($user);

        return new JsonResponse(PaginatedResource::from(
            $page,
            fn (TestSessionView $session): array => $this->presenter->present($session, $reserved[$session->id] ?? null),
        ));
    }

    #[Route('/languages', name: 'languages', methods: ['GET'], priority: 1)]
    #[OA\Get(summary: 'List the languages of upcoming sessions')]
    #[OA\Response(response: 200, description: 'Sorted languages.', content: new OA\JsonContent(properties: [new OA\Property(property: 'items', type: 'array', items: new OA\Items(type: 'string'), example: ['English', 'French'])]))]
    public function languages(ListLanguagesHandler $listLanguages): JsonResponse
    {
        return new JsonResponse(['items' => $listLanguages()]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[OA\Get(summary: 'Get a test session')]
    #[OA\Response(response: 200, description: 'The session.', content: new OA\JsonContent(ref: '#/components/schemas/TestSession'))]
    #[ErrorResponse(404, ErrorResponse::NOT_FOUND)]
    public function show(string $id, GetTestSessionHandler $getSession, #[CurrentUser] UserInterface $user): JsonResponse
    {
        $session = $getSession(new GetTestSessionQuery($id));

        return new JsonResponse($this->presenter->present($session, $this->reservedSessionsOf($user)[$session->id] ?? null));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[OA\Post(summary: 'Create a test session (administrators)')]
    #[OA\Response(response: 201, description: 'Session created.', content: new OA\JsonContent(ref: '#/components/schemas/TestSession'))]
    #[ErrorResponse(403, ErrorResponse::FORBIDDEN)]
    #[ErrorResponse(422, ErrorResponse::VALIDATION_FAILED)]
    #[IsGranted('ROLE_ADMIN')]
    public function create(
        #[MapRequestPayload(acceptFormat: 'json')]
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
    #[OA\Put(summary: 'Update a test session (administrators)')]
    #[OA\Response(response: 200, description: 'The updated session.', content: new OA\JsonContent(ref: '#/components/schemas/TestSession'))]
    #[ErrorResponse(403, ErrorResponse::FORBIDDEN)]
    #[ErrorResponse(404, ErrorResponse::NOT_FOUND)]
    #[ErrorResponse(409, 'Conflicts with the current state (see `code`).')]
    #[ErrorResponse(422, ErrorResponse::VALIDATION_FAILED)]
    #[IsGranted('ROLE_ADMIN')]
    public function update(
        string $id,
        #[MapRequestPayload(acceptFormat: 'json')]
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
    #[OA\Delete(summary: 'Delete a test session without bookings (administrators)')]
    #[OA\Response(response: 204, description: 'Deleted.')]
    #[ErrorResponse(403, ErrorResponse::FORBIDDEN)]
    #[ErrorResponse(404, ErrorResponse::NOT_FOUND)]
    #[ErrorResponse(409, 'Conflicts with the current state (see `code`).')]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(string $id, DeleteTestSessionHandler $deleteSession): Response
    {
        $deleteSession(new DeleteTestSessionCommand($id));

        return new Response(status: Response::HTTP_NO_CONTENT);
    }

    /**
     * @return array<string, string> reservation id indexed by session id
     */
    private function reservedSessionsOf(UserInterface $user): array
    {
        return ($this->reservedSessions)(new ListReservedSessionsQuery($user->getUserIdentifier()));
    }
}
