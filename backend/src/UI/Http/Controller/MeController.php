<?php

declare(strict_types=1);

namespace App\UI\Http\Controller;

use App\Application\Identity\GetProfile\GetProfileHandler;
use App\Application\Identity\GetProfile\GetProfileQuery;
use App\Application\Identity\UpdateProfile\UpdateProfileCommand;
use App\Application\Identity\UpdateProfile\UpdateProfileHandler;
use App\UI\Http\OpenApi\ErrorResponse;
use App\UI\Http\RateLimit\RateLimit;
use App\UI\Http\Request\Identity\UpdateProfileRequest;
use App\UI\Http\Response\Identity\UserProfileResource;
use App\UI\Http\Security\CurrentUserId;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * The authenticated user's own account.
 */
#[AsController]
#[Route('/api/me', name: 'api_me_')]
#[OA\Tag(name: 'Account')]
#[ErrorResponse(Response::HTTP_UNAUTHORIZED, ErrorResponse::UNAUTHORIZED)]
final readonly class MeController
{
    #[Route('', name: 'show', methods: ['GET'])]
    #[OA\Get(summary: 'Get my account')]
    #[OA\Response(response: Response::HTTP_OK, description: 'The account.', content: new OA\JsonContent(ref: '#/components/schemas/UserProfile'))]
    public function show(#[CurrentUserId] string $userId, GetProfileHandler $getProfile): JsonResponse
    {
        $profile = $getProfile(new GetProfileQuery($userId));

        return new JsonResponse(UserProfileResource::from($profile));
    }

    #[Route('', name: 'update', methods: ['PUT'])]
    #[OA\Put(summary: 'Update my name and email')]
    #[OA\Response(response: Response::HTTP_OK, description: 'The updated account.', content: new OA\JsonContent(ref: '#/components/schemas/UserProfile'))]
    #[ErrorResponse(Response::HTTP_CONFLICT, 'Conflicts with the current state (see `code`).')]
    #[ErrorResponse(Response::HTTP_UNPROCESSABLE_ENTITY, ErrorResponse::VALIDATION_FAILED)]
    #[ErrorResponse(Response::HTTP_TOO_MANY_REQUESTS, ErrorResponse::TOO_MANY_REQUESTS)]
    #[RateLimit('profile_update')]
    public function update(
        #[CurrentUserId]
        string $userId,
        #[MapRequestPayload(acceptFormat: 'json')]
        UpdateProfileRequest $request,
        UpdateProfileHandler $updateProfile,
    ): JsonResponse {
        $profile = $updateProfile(new UpdateProfileCommand($userId, $request->name, $request->email));

        return new JsonResponse(UserProfileResource::from($profile));
    }
}
