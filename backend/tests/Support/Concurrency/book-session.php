<?php

declare(strict_types=1);

/*
 * Worker used by ConcurrentBookingTest: boots the application in its own
 * process and books a session, printing the outcome ("booked" or an error code).
 *
 * Usage: php book-session.php <userId> <sessionId>
 */

use App\Application\Booking\BookSession\BookSessionCommand;
use App\Application\Booking\BookSession\BookSessionHandler;
use App\Domain\Shared\Exception\DomainException;
use App\Kernel;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__, 3).'/vendor/autoload.php';

(new Dotenv())->bootEnv(dirname(__DIR__, 3).'/.env');

$kernel = new Kernel('test', false);
$kernel->boot();

// The test container exposes private services; it only exists in the test
// environment, hence unknown to static analysis (which reads the dev container).
/** @var ContainerInterface $container */
$container = $kernel->getContainer()->get('test.service_container'); // @phpstan-ignore symfonyContainer.serviceNotFound
$bookSession = $container->get(BookSessionHandler::class); // @phpstan-ignore symfonyContainer.privateService

try {
    $bookSession(new BookSessionCommand($argv[1], $argv[2]));
    echo 'booked';
} catch (DomainException $exception) {
    echo $exception->errorCode();
}
