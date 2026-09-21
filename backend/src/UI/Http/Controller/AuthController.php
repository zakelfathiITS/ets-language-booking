<?php

declare(strict_types=1);

namespace App\UI\Http\Controller;

use App\Application\Identity\RegisterUser\RegisterUserCommand;
use App\Application\Identity\RegisterUser\RegisterUserHandler;
use App\UI\Http\OpenApi\ErrorResponse;
use App\UI\Http\RateLimit\RateLimit;
use App\UI\Http\Request\Identity\RegisterUserRequest;
use App\UI\Http\Response\Identity\UserProfileResource;
use Nelmio\ApiDocBundle\Attribute\Security;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\UnsupportedMediaTypeHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

#[AsController]
#[Route('/api/auth', name: 'api_auth_')]
#[OA\Tag(name: 'Authentication')]
#[Security(name: null)]
final readonly class AuthController
{
    public function __construct(
        private RegisterUserHandler $registerUser,
        private UrlGeneratorInterface $urlGenerator,
    ) {
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    #[OA\Post(summary: 'Create an account')]
    #[OA\Response(response: 201, description: 'Account created.', content: new OA\JsonContent(ref: '#/components/schemas/UserProfile'))]
    #[ErrorResponse(409, 'Conflicts with the current state (see `code`).')]
    #[ErrorResponse(422, ErrorResponse::VALIDATION_FAILED)]
    #[ErrorResponse(429, ErrorResponse::TOO_MANY_REQUESTS)]
    #[RateLimit('registration')]
    public function register(#[MapRequestPayload(acceptFormat: 'json')] RegisterUserRequest $request): JsonResponse
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
    #[OA\Post(
        summary: 'Sign in: the JWT (valid 1 hour) is set in the httpOnly "ets_token" cookie',
        description: 'Browsers send the cookie back automatically on /api requests. Other clients may send the same token as `Authorization: Bearer <token>`.',
    )]
    #[OA\RequestBody(required: true, content: new OA\JsonContent(
        required: ['email', 'password'],
        properties: [
            new OA\Property(property: 'email', type: 'string', format: 'email', example: 'candidate@ets.test'),
            new OA\Property(property: 'password', type: 'string', format: 'password', example: 'Candidate123!'),
        ],
    ))]
    #[OA\Response(
        response: 200,
        description: 'Signed in.',
        headers: [new OA\Header(header: 'Set-Cookie', description: '`ets_token=<JWT>; Path=/api; HttpOnly; SameSite=Strict; Secure`', schema: new OA\Schema(type: 'string'))],
        content: new OA\JsonContent(properties: [new OA\Property(property: 'user', ref: '#/components/schemas/UserProfile')]),
    )]
    #[ErrorResponse(401, 'Invalid credentials (`invalid_credentials`).')]
    #[ErrorResponse(429, 'Too many failed attempts (`too_many_login_attempts`), see `Retry-After`.')]
    public function login(): never
    {
        throw new UnsupportedMediaTypeHttpException('Send the credentials as JSON: {"email": "...", "password": "..."}.');
    }

    /**
     * Handled by the "logout" firewall (see LogoutResponseListener); this
     * method is never called, it only declares the route.
     */
    #[Route('/logout', name: 'logout', methods: ['POST'])]
    #[OA\Post(summary: 'Sign out: revokes the token and clears its cookie')]
    #[OA\Response(response: 204, description: 'Signed out (also when the token was already expired or missing).')]
    public function logout(): never
    {
        throw new \LogicException('Handled by the "logout" firewall.');
    }
}
