<?php

declare(strict_types=1);

namespace App\UI\Http\EventListener;

use App\UI\Http\Response\ProblemResponse;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationFailureEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTExpiredEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTInvalidEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTNotFoundEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;

/**
 * Aligns authentication failures with the Problem Details contract, with a
 * distinct code per cause so clients can react (e.g. sign out on "token_expired").
 */
final class AuthenticationProblemListener
{
    #[AsEventListener(event: Events::AUTHENTICATION_FAILURE)]
    public function onLoginFailure(AuthenticationFailureEvent $event): void
    {
        $exception = $event->getException();
        if ($exception instanceof TooManyLoginAttemptsAuthenticationException) {
            $minutes = max(1, (int) ($exception->getMessageData()['%minutes%'] ?? 1));
            $event->setResponse(new ProblemResponse(
                Response::HTTP_TOO_MANY_REQUESTS,
                'too_many_login_attempts',
                sprintf('Too many failed login attempts. Please try again in %d minute(s).', $minutes),
                headers: ['Retry-After' => (string) ($minutes * 60)],
            ));

            return;
        }

        // Same answer for an unknown email and a wrong password: no account enumeration.
        $event->setResponse($this->unauthorized('invalid_credentials', 'Invalid email or password.'));
    }

    #[AsEventListener(event: Events::JWT_NOT_FOUND)]
    public function onTokenNotFound(JWTNotFoundEvent $event): void
    {
        $event->setResponse($this->unauthorized('token_missing', 'An access token is required.'));
    }

    #[AsEventListener(event: Events::JWT_INVALID)]
    public function onTokenInvalid(JWTInvalidEvent $event): void
    {
        $event->setResponse($this->unauthorized('token_invalid', 'The access token is invalid.'));
    }

    #[AsEventListener(event: Events::JWT_EXPIRED)]
    public function onTokenExpired(JWTExpiredEvent $event): void
    {
        $event->setResponse($this->unauthorized('token_expired', 'The access token has expired.'));
    }

    private function unauthorized(string $code, string $detail): ProblemResponse
    {
        return new ProblemResponse(
            Response::HTTP_UNAUTHORIZED,
            $code,
            $detail,
            headers: ['WWW-Authenticate' => 'Bearer'],
        );
    }
}
