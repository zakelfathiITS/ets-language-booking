<?php

declare(strict_types=1);

namespace App\UI\Http\EventListener;

use App\Application\Identity\GetProfile\GetProfileHandler;
use App\Application\Identity\GetProfile\GetProfileQuery;
use App\UI\Http\Response\Identity\UserProfileResource;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

/**
 * Adds the account to the login response, sparing the client a GET /api/me.
 *
 * The profile deliberately stays out of the token itself: a JWT lives until it
 * expires and would show a stale name or email after a profile update.
 */
#[AsEventListener(event: Events::AUTHENTICATION_SUCCESS)]
final readonly class LoginSuccessListener
{
    public function __construct(private GetProfileHandler $getProfile)
    {
    }

    public function __invoke(AuthenticationSuccessEvent $event): void
    {
        $profile = ($this->getProfile)(new GetProfileQuery($event->getUser()->getUserIdentifier()));

        $data = $event->getData();
        $data['user'] = UserProfileResource::from($profile);
        $event->setData($data);
    }
}
