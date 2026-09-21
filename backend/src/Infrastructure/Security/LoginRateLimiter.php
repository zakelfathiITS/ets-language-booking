<?php

declare(strict_types=1);

namespace App\Infrastructure\Security;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RateLimiter\AbstractRequestRateLimiter;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\RateLimiter\LimiterInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Security\Http\SecurityRequestAttributes;

/**
 * Limits failed logins per client, per account and per both.
 *
 * Symfony's default limiter only counts per client: guessing one account's
 * password from many addresses would never be slowed down.
 */
final class LoginRateLimiter extends AbstractRequestRateLimiter
{
    public function __construct(
        #[Autowire(service: 'limiter.login_per_client')]
        private readonly RateLimiterFactory $perClient,
        #[Autowire(service: 'limiter.login_per_account')]
        private readonly RateLimiterFactory $perAccount,
        #[Autowire(service: 'limiter.login_per_client_and_account')]
        private readonly RateLimiterFactory $perClientAndAccount,
    ) {
    }

    /**
     * @return list<LimiterInterface>
     */
    protected function getLimiters(Request $request): array
    {
        $client = (string) $request->getClientIp();
        $account = mb_strtolower((string) $request->attributes->get(SecurityRequestAttributes::LAST_USERNAME, ''));

        return [
            $this->perClient->create($client),
            $this->perAccount->create($account),
            $this->perClientAndAccount->create($client.'-'.$account),
        ];
    }
}
