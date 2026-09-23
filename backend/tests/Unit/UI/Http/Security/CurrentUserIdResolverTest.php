<?php

declare(strict_types=1);

namespace App\Tests\Unit\UI\Http\Security;

use App\UI\Http\Security\CurrentUserId;
use App\UI\Http\Security\CurrentUserIdResolver;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadata;
use Symfony\Component\Security\Core\User\UserInterface;

#[CoversClass(CurrentUserIdResolver::class)]
final class CurrentUserIdResolverTest extends TestCase
{
    public function testItGivesTheIdOfTheAuthenticatedUser(): void
    {
        $resolver = new CurrentUserIdResolver($this->security('6ab11f30a428d1b92a0028c3'));

        $resolved = $resolver->resolve(new Request(), self::argument('string', [new CurrentUserId()]));

        self::assertSame(['6ab11f30a428d1b92a0028c3'], $resolved);
    }

    public function testItLeavesOtherArgumentsAlone(): void
    {
        $resolver = new CurrentUserIdResolver($this->security('6ab11f30a428d1b92a0028c3'));

        self::assertSame([], $resolver->resolve(new Request(), self::argument('string', [])), 'Without the attribute.');
        self::assertSame([], $resolver->resolve(new Request(), self::argument(UserInterface::class, [new CurrentUserId()])), 'Not a string.');
    }

    public function testAnAnonymousRequestIsAProgrammingError(): void
    {
        $resolver = new CurrentUserIdResolver($this->security(null));

        $this->expectException(\LogicException::class);
        $resolver->resolve(new Request(), self::argument('string', [new CurrentUserId()]));
    }

    private function security(?string $userId): Security
    {
        $user = null;
        if ($userId !== null) {
            $user = $this->createStub(UserInterface::class);
            $user->method('getUserIdentifier')->willReturn($userId);
        }

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);

        return $security;
    }

    /**
     * @param list<object> $attributes
     */
    private static function argument(string $type, array $attributes): ArgumentMetadata
    {
        return new ArgumentMetadata('userId', $type, false, false, null, false, $attributes);
    }
}
