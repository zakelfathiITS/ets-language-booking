<?php

declare(strict_types=1);

namespace App\UI\Cli;

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
 * Loads demo accounts and a catalogue of upcoming sessions, through the same
 * use cases as the API. Safe to run repeatedly: it stops if data exists.
 */
#[AsCommand(name: 'app:seed', description: 'Loads demo accounts and upcoming test sessions (idempotent).')]
final class SeedDemoDataCommand extends Command
{
    public const ADMIN_EMAIL = 'admin@ets.test';
    public const ADMIN_PASSWORD = 'Admin123!';
    public const CANDIDATE_EMAIL = 'candidate@ets.test';
    public const CANDIDATE_PASSWORD = 'Candidate123!';
    public const SESSION_COUNT = 30;

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

        $this->createAccounts();
        $this->createSessions();

        $io->success(sprintf('Demo data loaded: 2 accounts and %d upcoming sessions.', self::SESSION_COUNT));
        $io->table(['Account', 'Password', 'Role'], [
            [self::ADMIN_EMAIL, self::ADMIN_PASSWORD, 'Administrator'],
            [self::CANDIDATE_EMAIL, self::CANDIDATE_PASSWORD, 'Candidate'],
        ]);

        return Command::SUCCESS;
    }

    private function createAccounts(): void
    {
        ($this->registerUser)(new RegisterUserCommand('Alex Admin', self::ADMIN_EMAIL, self::ADMIN_PASSWORD));
        ($this->registerUser)(new RegisterUserCommand('Camille Martin', self::CANDIDATE_EMAIL, self::CANDIDATE_PASSWORD));

        $admin = $this->users->ofEmail(Email::fromString(self::ADMIN_EMAIL));
        \assert($admin !== null);
        $admin->grantRole(Role::Admin, $this->clock->now());
        $this->users->save($admin);
    }

    /**
     * Spreads sessions over the next two months, rotating languages, places,
     * times and capacities so every filter has something to show.
     */
    private function createSessions(): void
    {
        $today = $this->clock->now()->setTimezone(new \DateTimeZone($this->schedule->timezone()));

        for ($i = 0; $i < self::SESSION_COUNT; ++$i) {
            $day = $today->modify(sprintf('+%d days', 2 + 2 * $i));

            ($this->createSession)(new CreateTestSessionCommand(
                self::LANGUAGES[$i % \count(self::LANGUAGES)],
                $this->schedule->toInstant($day->format('Y-m-d'), self::TIMES[$i % \count(self::TIMES)]),
                self::LOCATIONS[$i % \count(self::LOCATIONS)],
                self::CAPACITIES[$i % \count(self::CAPACITIES)],
            ));
        }
    }
}
