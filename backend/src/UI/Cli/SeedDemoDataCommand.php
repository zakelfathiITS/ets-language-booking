<?php

declare(strict_types=1);

namespace App\UI\Cli;

use App\Application\Booking\BookSession\BookSessionCommand;
use App\Application\Booking\BookSession\BookSessionHandler;
use App\Application\Catalog\CreateTestSession\CreateTestSessionCommand;
use App\Application\Catalog\CreateTestSession\CreateTestSessionHandler;
use App\Application\Identity\RegisterUser\RegisterUserCommand;
use App\Application\Identity\RegisterUser\RegisterUserHandler;
use App\Domain\Identity\Email;
use App\Domain\Identity\Role;
use App\Domain\Identity\UserRepository;
use App\Domain\Shared\Clock;
use App\UI\Shared\ScheduleConverter;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Loads demo accounts, a catalogue of upcoming sessions and a few bookings,
 * through the same use cases as the API. Safe to run repeatedly: it stops if
 * data exists.
 *
 * The candidate starts with two reservations, and one single-seat session is
 * taken by the administrator, so every booking state is visible right away.
 */
#[AsCommand(name: 'app:seed', description: 'Loads demo accounts, upcoming test sessions and bookings (idempotent).')]
final class SeedDemoDataCommand extends Command
{
    public const ADMIN_EMAIL = 'admin@ets.test';
    public const ADMIN_PASSWORD = 'Admin123!';
    public const CANDIDATE_EMAIL = 'candidate@ets.test';
    public const CANDIDATE_PASSWORD = 'Candidate123!';
    public const SESSION_COUNT = 30;
    /** Index of the single-seat session booked by the administrator (shown as full). */
    public const FULL_SESSION_INDEX = 3;
    /** Indexes of the sessions booked by the candidate. */
    public const CANDIDATE_BOOKINGS = [0, 5];

    private const LANGUAGES = ['English', 'French', 'Spanish', 'German', 'Italian', 'Arabic', 'Japanese'];
    private const LOCATIONS = [
        'Paris – Test Center La Défense',
        'Lyon – Test Center Part-Dieu',
        'Brussels – Test Center Schuman',
        'Casablanca – Test Center Anfa',
        'Madrid – Test Center Chamartín',
        'Online – Remote proctoring',
    ];
    private const TIMES = ['09:00', '11:00', '14:00', '16:30'];
    private const CAPACITIES = [8, 12, 20, 30];

    public function __construct(
        private readonly RegisterUserHandler $registerUser,
        private readonly UserRepository $users,
        private readonly CreateTestSessionHandler $createSession,
        private readonly BookSessionHandler $bookSession,
        private readonly ScheduleConverter $schedule,
        private readonly Clock $clock,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        if ($this->users->ofEmail(Email::fromString(self::ADMIN_EMAIL)) !== null) {
            $io->note('Demo data is already loaded: nothing to do.');

            return Command::SUCCESS;
        }

        [$adminId, $candidateId] = $this->createAccounts();
        $sessionIds = $this->createSessions();
        $this->createBookings($sessionIds, $adminId, $candidateId);

        $io->success(sprintf(
            'Demo data loaded: 2 accounts, %d upcoming sessions and %d reservations.',
            self::SESSION_COUNT,
            \count(self::CANDIDATE_BOOKINGS) + 1,
        ));
        $io->table(['Account', 'Password', 'Role'], [
            [self::ADMIN_EMAIL, self::ADMIN_PASSWORD, 'Administrator'],
            [self::CANDIDATE_EMAIL, self::CANDIDATE_PASSWORD, 'Candidate'],
        ]);

        return Command::SUCCESS;
    }

    /**
     * @return array{string, string} ids of the administrator and of the candidate
     */
    private function createAccounts(): array
    {
        $admin = ($this->registerUser)(new RegisterUserCommand('Alex Admin', self::ADMIN_EMAIL, self::ADMIN_PASSWORD));
        $candidate = ($this->registerUser)(new RegisterUserCommand('Camille Martin', self::CANDIDATE_EMAIL, self::CANDIDATE_PASSWORD));

        $adminUser = $this->users->ofEmail(Email::fromString(self::ADMIN_EMAIL));
        \assert($adminUser !== null);
        $adminUser->grantRole(Role::Admin, $this->clock->now());
        $this->users->save($adminUser);

        return [$admin->id, $candidate->id];
    }

    /**
     * Spreads sessions over the next two months, rotating languages, places,
     * times and capacities so every filter has something to show.
     *
     * @return list<string> session ids, soonest first
     */
    private function createSessions(): array
    {
        $ids = [];
        $today = $this->clock->now()->setTimezone(new \DateTimeZone($this->schedule->timezone()));

        for ($i = 0; $i < self::SESSION_COUNT; ++$i) {
            $day = $today->modify(sprintf('+%d days', 2 + 2 * $i));

            $ids[] = ($this->createSession)(new CreateTestSessionCommand(
                self::LANGUAGES[$i % \count(self::LANGUAGES)],
                $this->schedule->toInstant($day->format('Y-m-d'), self::TIMES[$i % \count(self::TIMES)]),
                self::LOCATIONS[$i % \count(self::LOCATIONS)],
                $i === self::FULL_SESSION_INDEX ? 1 : self::CAPACITIES[$i % \count(self::CAPACITIES)],
            ))->id;
        }

        return $ids;
    }

    /**
     * @param list<string> $sessionIds
     */
    private function createBookings(array $sessionIds, string $adminId, string $candidateId): void
    {
        ($this->bookSession)(new BookSessionCommand($adminId, $sessionIds[self::FULL_SESSION_INDEX]));

        foreach (self::CANDIDATE_BOOKINGS as $index) {
            ($this->bookSession)(new BookSessionCommand($candidateId, $sessionIds[$index]));
        }
    }
}
