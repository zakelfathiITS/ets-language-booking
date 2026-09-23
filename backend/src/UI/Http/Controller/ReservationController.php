<?php

declare(strict_types=1);

namespace App\UI\Http\Controller;

use App\Application\Booking\BookSession\BookSessionCommand;
use App\Application\Booking\BookSession\BookSessionHandler;
use App\Application\Booking\CancelReservation\CancelReservationCommand;
use App\Application\Booking\CancelReservation\CancelReservationHandler;
use App\Application\Booking\GetReservation\GetReservationHandler;
use App\Application\Booking\GetReservation\GetReservationQuery;
use App\Application\Booking\ListUserReservations\ListUserReservationsHandler;
use App\Application\Booking\ListUserReservations\ListUserReservationsQuery;
use App\UI\Http\OpenApi\ErrorResponse;
use App\UI\Http\RateLimit\RateLimit;
use App\UI\Http\Request\Booking\BookSessionRequest;
use App\UI\Http\Response\Booking\ReservationPresenter;
use App\UI\Http\Security\CurrentUserId;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/**
 * The authenticated user's own reservations.
 */
#[AsController]
#[Route('/api/reservations', name: 'api_reservations_')]
#[OA\Tag(name: 'Reservations')]
#[ErrorResponse(Response::HTTP_UNAUTHORIZED, ErrorResponse::UNAUTHORIZED)]
final readonly class ReservationController
{
    public function __construct(private ReservationPresenter $presenter)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(summary: 'List my reservations (upcoming first)')]
    #[OA\Response(response: Response::HTTP_OK, description: 'My reservations.', content: new OA\JsonContent(properties: [new OA\Property(property: 'items', type: 'array', items: new OA\Items(ref: '#/components/schemas/Reservation'))]))]
    public function list(#[CurrentUserId] string $userId, ListUserReservationsHandler $listReservations): JsonResponse
    {
        $reservations = $listReservations(new ListUserReservationsQuery($userId));

        return new JsonResponse(['items' => array_map($this->presenter->present(...), $reservations)]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[OA\Post(summary: 'Book a seat in a session')]
    #[OA\Response(response: Response::HTTP_CREATED, description: 'Seat booked.', content: new OA\JsonContent(ref: '#/components/schemas/Reservation'))]
    #[ErrorResponse(Response::HTTP_NOT_FOUND, ErrorResponse::NOT_FOUND)]
    #[ErrorResponse(Response::HTTP_CONFLICT, '`already_reserved`, `session_full` or `session_already_started`.')]
    #[ErrorResponse(Response::HTTP_UNPROCESSABLE_ENTITY, ErrorResponse::VALIDATION_FAILED)]
    #[ErrorResponse(Response::HTTP_TOO_MANY_REQUESTS, ErrorResponse::TOO_MANY_REQUESTS)]
    #[RateLimit('booking')]
    public function create(
        #[CurrentUserId]
        string $userId,
        #[MapRequestPayload(acceptFormat: 'json')]
        BookSessionRequest $request,
        BookSessionHandler $bookSession,
        UrlGeneratorInterface $urlGenerator,
    ): JsonResponse {
        $reservation = $bookSession(new BookSessionCommand($userId, $request->sessionId));

        return new JsonResponse(
            $this->presenter->present($reservation),
            Response::HTTP_CREATED,
            ['Location' => $urlGenerator->generate('api_reservations_show', ['id' => $reservation->id])],
        );
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[OA\Get(summary: 'Get one of my reservations')]
    #[OA\Response(response: Response::HTTP_OK, description: 'The reservation.', content: new OA\JsonContent(ref: '#/components/schemas/Reservation'))]
    #[ErrorResponse(Response::HTTP_NOT_FOUND, ErrorResponse::NOT_FOUND)]
    public function show(string $id, #[CurrentUserId] string $userId, GetReservationHandler $getReservation): JsonResponse
    {
        return new JsonResponse($this->presenter->present(
            $getReservation(new GetReservationQuery($userId, $id)),
        ));
    }

    #[Route('/{id}', name: 'cancel', methods: ['DELETE'])]
    #[OA\Delete(summary: 'Cancel one of my reservations')]
    #[OA\Response(response: Response::HTTP_NO_CONTENT, description: 'Cancelled: the seat is free again.')]
    #[ErrorResponse(Response::HTTP_NOT_FOUND, ErrorResponse::NOT_FOUND)]
    #[ErrorResponse(Response::HTTP_CONFLICT, '`session_already_started`: a session that has started is history.')]
    public function cancel(string $id, #[CurrentUserId] string $userId, CancelReservationHandler $cancelReservation): Response
    {
        $cancelReservation(new CancelReservationCommand($userId, $id));

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
