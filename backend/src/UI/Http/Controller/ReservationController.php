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
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * The authenticated user's own reservations.
 */
#[AsController]
#[Route('/api/reservations', name: 'api_reservations_')]
#[OA\Tag(name: 'Reservations')]
#[ErrorResponse(401, ErrorResponse::UNAUTHORIZED)]
final readonly class ReservationController
{
    public function __construct(private ReservationPresenter $presenter)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(summary: 'List my reservations (upcoming first)')]
    #[OA\Response(response: 200, description: 'My reservations.', content: new OA\JsonContent(properties: [new OA\Property(property: 'items', type: 'array', items: new OA\Items(ref: '#/components/schemas/Reservation'))]))]
    public function list(#[CurrentUser] UserInterface $user, ListUserReservationsHandler $listReservations): JsonResponse
    {
        $reservations = $listReservations(new ListUserReservationsQuery($user->getUserIdentifier()));

        return new JsonResponse(['items' => array_map($this->presenter->present(...), $reservations)]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[OA\Post(summary: 'Book a seat in a session')]
    #[OA\Response(response: 201, description: 'Seat booked.', content: new OA\JsonContent(ref: '#/components/schemas/Reservation'))]
    #[ErrorResponse(404, ErrorResponse::NOT_FOUND)]
    #[ErrorResponse(409, '`already_reserved`, `session_full` or `session_already_started`.')]
    #[ErrorResponse(422, ErrorResponse::VALIDATION_FAILED)]
    #[ErrorResponse(429, ErrorResponse::TOO_MANY_REQUESTS)]
    #[RateLimit('booking')]
    public function create(
        #[CurrentUser]
        UserInterface $user,
        #[MapRequestPayload(acceptFormat: 'json')]
        BookSessionRequest $request,
        BookSessionHandler $bookSession,
        UrlGeneratorInterface $urlGenerator,
    ): JsonResponse {
        $reservation = $bookSession(new BookSessionCommand($user->getUserIdentifier(), trim($request->sessionId)));

        return new JsonResponse(
            $this->presenter->present($reservation),
            Response::HTTP_CREATED,
            ['Location' => $urlGenerator->generate('api_reservations_show', ['id' => $reservation->id])],
        );
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[OA\Get(summary: 'Get one of my reservations')]
    #[OA\Response(response: 200, description: 'The reservation.', content: new OA\JsonContent(ref: '#/components/schemas/Reservation'))]
    #[ErrorResponse(404, ErrorResponse::NOT_FOUND)]
    public function show(string $id, #[CurrentUser] UserInterface $user, GetReservationHandler $getReservation): JsonResponse
    {
        return new JsonResponse($this->presenter->present(
            $getReservation(new GetReservationQuery($user->getUserIdentifier(), $id)),
        ));
    }

    #[Route('/{id}', name: 'cancel', methods: ['DELETE'])]
    #[OA\Delete(summary: 'Cancel one of my reservations')]
    #[OA\Response(response: 204, description: 'Cancelled: the seat is free again.')]
    #[ErrorResponse(404, ErrorResponse::NOT_FOUND)]
    #[ErrorResponse(409, '`session_already_started`: a session that has started is history.')]
    public function cancel(string $id, #[CurrentUser] UserInterface $user, CancelReservationHandler $cancelReservation): Response
    {
        $cancelReservation(new CancelReservationCommand($user->getUserIdentifier(), $id));

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
