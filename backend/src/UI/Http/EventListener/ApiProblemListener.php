<?php

declare(strict_types=1);

namespace App\UI\Http\EventListener;

use App\Domain\Shared\Exception\ConflictException;
use App\Domain\Shared\Exception\DomainException;
use App\Domain\Shared\Exception\InvariantViolationException;
use App\Domain\Shared\Exception\NotFoundException;
use App\UI\Http\Response\ProblemResponse;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Validator\Exception\ValidationFailedException;

/**
 * Turns every exception raised under /api into a Problem Details response.
 *
 * Runs after the security layer (priority 1) and Symfony's exception logger
 * (priority 0), but before the default HTML error renderer (priority -128).
 */
#[AsEventListener(event: KernelEvents::EXCEPTION, priority: -64)]
final class ApiProblemListener
{
    private const API_PATH_PREFIX = '/api';

    public function __construct(
        #[Autowire('%kernel.debug%')]
        private readonly bool $debug,
    ) {
    }

    public function __invoke(ExceptionEvent $event): void
    {
        if (!str_starts_with($event->getRequest()->getPathInfo(), self::API_PATH_PREFIX)) {
            return;
        }

        $event->setResponse($this->toProblem($event->getThrowable()));
    }

    private function toProblem(\Throwable $throwable): ProblemResponse
    {
        $violations = $this->findViolations($throwable);
        if ($violations !== null) {
            return new ProblemResponse(
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'validation_failed',
                'The request contains invalid data.',
                $violations,
            );
        }

        $domainException = $this->findDomainException($throwable);
        if ($domainException !== null) {
            return new ProblemResponse(
                $this->statusForDomainException($domainException),
                $domainException->errorCode(),
                $domainException->getMessage(),
            );
        }

        if ($throwable instanceof HttpExceptionInterface) {
            $status = $throwable->getStatusCode();

            return new ProblemResponse(
                $status,
                $this->codeForStatus($status),
                $this->detailForHttpException($throwable),
                headers: $throwable->getHeaders(),
            );
        }

        return new ProblemResponse(
            Response::HTTP_INTERNAL_SERVER_ERROR,
            'internal_error',
            $this->debug ? $throwable->getMessage() : 'An unexpected error occurred.',
        );
    }

    private function statusForDomainException(DomainException $exception): int
    {
        return match (true) {
            $exception instanceof NotFoundException => Response::HTTP_NOT_FOUND,
            $exception instanceof ConflictException => Response::HTTP_CONFLICT,
            $exception instanceof InvariantViolationException => Response::HTTP_UNPROCESSABLE_ENTITY,
            default => Response::HTTP_BAD_REQUEST,
        };
    }

    /**
     * Domain exceptions may reach the kernel wrapped (e.g. by framework
     * listeners): the most specific error code must win anyway.
     */
    private function findDomainException(\Throwable $throwable): ?DomainException
    {
        for ($current = $throwable; $current !== null; $current = $current->getPrevious()) {
            if ($current instanceof DomainException) {
                return $current;
            }
        }

        return null;
    }

    /**
     * #[MapRequestPayload] wraps validation errors in an HTTP 422 exception:
     * the violations are found by walking the chain of previous exceptions.
     *
     * @return list<array{field: string, message: string}>|null
     */
    private function findViolations(\Throwable $throwable): ?array
    {
        for ($current = $throwable; $current !== null; $current = $current->getPrevious()) {
            if (!$current instanceof ValidationFailedException) {
                continue;
            }

            $violations = [];
            foreach ($current->getViolations() as $violation) {
                $violations[] = [
                    'field' => $violation->getPropertyPath(),
                    'message' => (string) $violation->getMessage(),
                ];
            }

            return $violations;
        }

        return null;
    }

    private function detailForHttpException(HttpExceptionInterface&\Throwable $exception): string
    {
        $status = $exception->getStatusCode();

        // Server-side messages may reveal internals: only shown while debugging.
        if ($status >= 500 && !$this->debug) {
            return 'An unexpected error occurred.';
        }

        return $exception->getMessage() !== '' ? $exception->getMessage() : (Response::$statusTexts[$status] ?? 'Error');
    }

    /**
     * "Method Not Allowed" becomes "method_not_allowed".
     */
    private function codeForStatus(int $status): string
    {
        $text = Response::$statusTexts[$status] ?? 'error';

        return trim((string) preg_replace('/[^a-z0-9]+/', '_', strtolower($text)), '_');
    }
}
