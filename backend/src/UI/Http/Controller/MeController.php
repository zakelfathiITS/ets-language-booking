<?php

declare(strict_types=1);

namespace App\UI\Http\Controller;

use App\Application\Identity\GetProfile\GetProfileHandler;
use App\Application\Identity\GetProfile\GetProfileQuery;
use App\Application\Identity\UpdateProfile\UpdateProfileCommand;
use App\Application\Identity\UpdateProfile\UpdateProfileHandler;
use App\UI\Http\Request\Identity\UpdateProfileRequest;
use App\UI\Http\Response\Identity\UserProfileResource;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * The authenticated user's own account.
 */
#[AsController]
#[Route('/api/me', name: 'api_me_')]
final readonly class MeController
{
    public function __construct(
        private GetProfileHandler $getProfile,
        private UpdateProfileHandler $updateProfile,
    ) {
    }

    #[Route('', name: 'show', methods: ['GET'])]
    public function show(#[CurrentUser] UserInterface $user): JsonResponse
    {
        $profile = ($this->getProfile)(new GetProfileQuery($user->getUserIdentifier()));

        return new JsonResponse(UserProfileResource::from($profile));
    }

    #[Route('', name: 'update', methods: ['PUT'])]
    public function update(
        #[CurrentUser]
        UserInterface $user,
        #[MapRequestPayload]
        UpdateProfileRequest $request,
    ): JsonResponse {
        $profile = ($this->updateProfile)(
            new UpdateProfileCommand($user->getUserIdentifier(), $request->name, $request->email),
        );

        return new JsonResponse(UserProfileResource::from($profile));
    }
}
