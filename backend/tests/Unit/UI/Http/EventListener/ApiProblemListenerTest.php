<?php

declare(strict_types=1);

namespace App\Tests\Unit\UI\Http\EventListener;

use App\Domain\Shared\Exception\ConflictException;
use App\Domain\Shared\Exception\InvariantViolationException;
use App\Domain\Shared\Exception\NotFoundException;
use App\UI\Http\EventListener\ApiProblemListener;
use App\UI\Http\Response\ProblemResponse;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Exception\ValidationFailedException;

#[CoversClass(ApiProblemListener::class)]
#[CoversClass(ProblemResponse::class)]
final class ApiProblemListenerTest extends TestCase
{
    public function testItLeavesNonApiRequestsToTheDefaultErrorHandling(): void
    {
        $event = $this->dispatch(new \RuntimeException('boom'), path: '/not-api');

        self::assertNull($event->getResponse());
    }

    public function testValidationErrorsBecomeA422WithFieldViolations(): void
    {
        $violations = new ConstraintViolationList([
            new ConstraintViolation('This value should not be blank.', null, [], null, 'email', ''),
            new ConstraintViolation('This value is too short.', null, [], null, 'name', 'a'),
        ]);
        $exception = new UnprocessableEntityHttpException('', new ValidationFailedException(null, $violations));

        $problem = $this->problemFor($exception);

        self::assertSame(422, $problem['status']);
        self::assertSame('validation_failed', $problem['code']);
        self::assertSame([
            ['field' => 'email', 'message' => 'This value should not be blank.'],
            ['field' => 'name', 'message' => 'This value is too short.'],
        ], $problem['violations']);
    }

    public function testDomainCategoriesMapToHttpStatuses(): void
    {
        $notFound = new class('Session not found.') extends NotFoundException {
            public function errorCode(): string
            {
                return 'session_not_found';
            }
        };
        $conflict = new class('No seat left.') extends ConflictException {
            public function errorCode(): string
            {
                return 'session_full';
            }
        };
        $invariant = new class('Capacity must be positive.') extends InvariantViolationException {
            public function errorCode(): string
            {
                return 'invalid_capacity';
            }
        };

        self::assertSame(
            ['status' => 404, 'code' => 'session_not_found', 'detail' => 'Session not found.'],
            array_intersect_key($this->problemFor($notFound), array_flip(['status', 'code', 'detail'])),
        );
        self::assertSame(409, $this->problemFor($conflict)['status']);
        self::assertSame('session_full', $this->problemFor($conflict)['code']);
        self::assertSame(422, $this->problemFor($invariant)['status']);
    }

    public function testHttpExceptionsKeepTheirStatusAndHeaders(): void
    {
        $event = $this->dispatch(new MethodNotAllowedHttpException(['GET'], 'Method Not Allowed (Allow: GET)'));
        $response = $event->getResponse();

        self::assertInstanceOf(Response::class, $response);
        self::assertSame(405, $response->getStatusCode());
        self::assertSame('GET', $response->headers->get('Allow'));
        self::assertSame('method_not_allowed', $this->decode($response)['code']);
    }

    public function testUnexpectedErrorsHideTheirMessageOutsideDebugMode(): void
    {
        $problem = $this->problemFor(new \RuntimeException('SQLSTATE secret details'), debug: false);

        self::assertSame(500, $problem['status']);
        self::assertSame('internal_error', $problem['code']);
        self::assertSame('An unexpected error occurred.', $problem['detail']);
    }

    public function testServerSideHttpErrorsAreAlsoHiddenOutsideDebugMode(): void
    {
        $problem = $this->problemFor(new ServiceUnavailableHttpException(null, 'Upstream mongodb-1 refused'), debug: false);

        self::assertSame(503, $problem['status']);
        self::assertSame('An unexpected error occurred.', $problem['detail']);
    }

    public function testUnexpectedErrorsShowTheirMessageInDebugMode(): void
    {
        $problem = $this->problemFor(new \RuntimeException('boom'), debug: true);

        self::assertSame('boom', $problem['detail']);
    }

    public function testResponsesFollowTheProblemDetailsFormat(): void
    {
        $response = $this->dispatch(new \RuntimeException('boom'))->getResponse();

        self::assertInstanceOf(Response::class, $response);
        self::assertSame(ProblemResponse::CONTENT_TYPE, $response->headers->get('Content-Type'));
        self::assertSame(
            ['type' => 'about:blank', 'title' => 'Internal Server Error', 'status' => 500],
            array_intersect_key($this->decode($response), array_flip(['type', 'title', 'status'])),
        );
    }

    private function dispatch(\Throwable $exception, string $path = '/api/resource', bool $debug = false): ExceptionEvent
    {
        $event = new ExceptionEvent(
            $this->createStub(HttpKernelInterface::class),
            Request::create($path),
            HttpKernelInterface::MAIN_REQUEST,
            $exception,
        );

        (new ApiProblemListener($debug))($event);

        return $event;
    }

    /**
     * @return array<string, mixed>
     */
    private function problemFor(\Throwable $exception, bool $debug = false): array
    {
        $response = $this->dispatch($exception, debug: $debug)->getResponse();
        self::assertInstanceOf(Response::class, $response);

        return $this->decode($response);
    }

    /**
     * @return array<string, mixed>
     */
    private function decode(Response $response): array
    {
        $decoded = json_decode((string) $response->getContent(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($decoded);

        return $decoded;
    }
}
