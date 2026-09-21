<?php

declare(strict_types=1);

namespace App\UI\Http\RateLimit;

use Psr\Container\ContainerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\DependencyInjection\Attribute\AutowireLocator;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

/**
 * Enforces #[RateLimit] before the controller runs; over the limit, the
 * caller gets a 429 with "Retry-After".
 */
#[AsEventListener(event: KernelEvents::CONTROLLER)]
final readonly class RateLimitListener
{
    public function __construct(
        #[AutowireLocator([
            'registration' => new Autowire(service: 'limiter.registration'),
            'booking' => new Autowire(service: 'limiter.booking'),
            'profile_update' => new Autowire(service: 'limiter.profile_update'),
        ])]
        private ContainerInterface $limiters,
        private Security $security,
    ) {
    }

    public function __invoke(ControllerEvent $event): void
    {
        /** @var list<RateLimit> $rateLimits */
        $rateLimits = $event->getAttributes(RateLimit::class);

        foreach ($rateLimits as $rateLimit) {
            /** @var RateLimiterFactory $factory */
            $factory = $this->limiters->get($rateLimit->limiter);
            $key = $this->security->getUser()?->getUserIdentifier() ?? (string) $event->getRequest()->getClientIp();

            $limit = $factory->create($key)->consume();
            if (!$limit->isAccepted()) {
                $retryAfter = max(1, $limit->getRetryAfter()->getTimestamp() - time());

                throw new TooManyRequestsHttpException($retryAfter, 'Too many requests. Please try again later.');
            }
        }
    }
}
