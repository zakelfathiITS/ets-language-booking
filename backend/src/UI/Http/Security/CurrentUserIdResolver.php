<?php

declare(strict_types=1);

namespace App\UI\Http\Security;

use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Controller\ValueResolverInterface;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadata;

/**
 * Resolves #[CurrentUserId] string arguments (see the attribute).
 */
final readonly class CurrentUserIdResolver implements ValueResolverInterface
{
    public function __construct(private Security $security)
    {
    }

    /**
     * @return list<string>
     */
    public function resolve(Request $request, ArgumentMetadata $argument): array
    {
        if ($argument->getType() !== 'string' || $argument->getAttributes(CurrentUserId::class) === []) {
            return [];
        }

        $user = $this->security->getUser()
            ?? throw new \LogicException('#[CurrentUserId] needs a firewall that authenticates the request.');

        return [$user->getUserIdentifier()];
    }
}
