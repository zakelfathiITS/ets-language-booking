<?php

declare(strict_types=1);

namespace App\UI\Http\Controller;

use App\Application\Identity\RegisterUser\RegisterUserCommand;
use App\Application\Identity\RegisterUser\RegisterUserHandler;
use App\UI\Http\Request\Identity\RegisterUserRequest;
use App\UI\Http\Response\Identity\UserProfileResource;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\UnsupportedMediaTypeHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

#[AsController]
#[Route('/api/auth', name: 'api_auth_')]
final readonly class AuthController
{
    public function __construct(
        private RegisterUserHandler $registerUser,
        private UrlGeneratorInterface $urlGenerator,
    ) {
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(#[MapRequestPayload] RegisterUserRequest $request): JsonResponse
    {
        $profile = ($this->registerUser)(
            new RegisterUserCommand($request->name, $request->email, $request->password),
        );

        return new JsonResponse(
            UserProfileResource::from($profile),
            Response::HTTP_CREATED,
            ['Location' => $this->urlGenerator->generate('api_me_show')],
        );
    }

    /**
     * JSON credentials are handled by the json_login authenticator of the
     * "login" firewall before reaching this point; only non-JSON requests get here.
     */
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(): never
    {
        throw new UnsupportedMediaTypeHttpException('Send the credentials as JSON: {"email": "...", "password": "..."}.');
    }
}
