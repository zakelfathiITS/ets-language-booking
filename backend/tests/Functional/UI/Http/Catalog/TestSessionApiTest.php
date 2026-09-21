<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Http\Catalog;

use App\Domain\Identity\Role;
use App\Tests\Support\ApiTestCase;
use App\Tests\Support\CatalogFixtures;
use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\Attributes\DataProvider;

#[CoversNothing]
final class TestSessionApiTest extends ApiTestCase
{
    use CatalogFixtures;

    public function testTheCatalogueRequiresAuthentication(): void
    {
        $this->requestJson('GET', '/api/sessions');

        self::assertResponseStatusCodeSame(401);
    }

    public function testItListsUpcomingSessionsSoonestFirstWithPagination(): void
    {
        for ($day = 12; $day >= 1; --$day) {
            $this->createSession(startsIn: sprintf('+%d days', $day));
        }
        $this->moveToThePast($this->createSession());
        $token = $this->createUserAndLogin();

        $first = $this->requestJson('GET', '/api/sessions', token: $token);
        $second = $this->requestJson('GET', '/api/sessions?page=2', token: $token);

        self::assertResponseIsSuccessful();
        self::assertIsArray($first['items']);
        self::assertCount(10, $first['items']);
        self::assertSame(
            ['page' => 1, 'limit' => 10, 'totalItems' => 12, 'totalPages' => 2, 'hasNextPage' => true, 'hasPreviousPage' => false],
            $first['pagination'],
        );
        self::assertIsArray($second['items']);
        self::assertCount(2, $second['items']);
        $dates = array_column($first['items'], 'scheduledAt');
        $sorted = $dates;
        sort($sorted);
        self::assertSame($sorted, $dates);
    }

    public function testASessionExposesItsLocalDateTimeAndAvailability(): void
    {
        $id = $this->createSession('Japanese', '2030-06-14 07:00:00 UTC', capacity: 8);
        $this->setSeatsTaken($id, 3);
        $token = $this->createUserAndLogin();

        $data = $this->requestJson('GET', '/api/sessions/'.$id, token: $token);

        self::assertResponseIsSuccessful();
        self::assertSame([
            'id' => $id,
            'language' => 'Japanese',
            'date' => '2030-06-14',
            'time' => '09:00',
            'timezone' => 'Europe/Paris',
            'scheduledAt' => '2030-06-14T09:00:00+02:00',
            'location' => 'Paris – Test Center La Défense',
            'capacity' => 8,
            'seatsTaken' => 3,
            'seatsAvailable' => 5,
            'isFull' => false,
            'hasStarted' => false,
        ], $data);
    }

    public function testItFiltersByLanguageAndAvailabilityAndCanIncludePastSessions(): void
    {
        $this->createSession('English');
        $full = $this->createSession('French', capacity: 2);
        $this->setSeatsTaken($full, 2);
        $this->moveToThePast($this->createSession('French'));
        $token = $this->createUserAndLogin();

        self::assertSame(2, $this->totalOf('/api/sessions?language=french&includePast=1', $token));
        self::assertSame(1, $this->totalOf('/api/sessions?language=french', $token));
        self::assertSame(0, $this->totalOf('/api/sessions?language=french&availableOnly=1', $token));
        self::assertSame(1, $this->totalOf('/api/sessions?availableOnly=true', $token));
    }

    public function testTheLimitIsCapped(): void
    {
        $data = $this->requestJson('GET', '/api/sessions?limit=500', token: $this->createUserAndLogin());

        self::assertIsArray($data['pagination']);
        self::assertSame(50, $data['pagination']['limit']);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function malformedQueries(): iterable
    {
        yield 'non-numeric page' => ['page=abc'];
        yield 'negative page' => ['page=-3'];
        yield 'zero limit' => ['limit=0'];
        yield 'non-boolean flag' => ['availableOnly=maybe'];
    }

    #[DataProvider('malformedQueries')]
    public function testMalformedQueryParametersAreBadRequests(string $query): void
    {
        $data = $this->requestJson('GET', '/api/sessions?'.$query, token: $this->createUserAndLogin());

        self::assertResponseStatusCodeSame(400);
        self::assertSame('bad_request', $data['code']);
    }

    public function testItListsTheLanguagesOnOffer(): void
    {
        $this->createSession('Spanish');
        $this->createSession('English');

        $data = $this->requestJson('GET', '/api/sessions/languages', token: $this->createUserAndLogin());

        self::assertResponseIsSuccessful();
        self::assertSame(['items' => ['English', 'Spanish']], $data);
    }

    public function testAnUnknownSessionIsNotFound(): void
    {
        $token = $this->createUserAndLogin();

        $data = $this->requestJson('GET', '/api/sessions/ffffffffffffffffffffffff', token: $token);
        self::assertResponseStatusCodeSame(404);
        self::assertSame('session_not_found', $data['code']);

        $this->requestJson('GET', '/api/sessions/not-an-id', token: $token);
        self::assertResponseStatusCodeSame(404);
    }

    public function testAnAdministratorCreatesASession(): void
    {
        $token = $this->createUserAndLogin('admin@example.com', [Role::Admin]);

        $data = $this->requestJson('POST', '/api/sessions', [
            'language' => 'german',
            'date' => '2030-01-20',
            'time' => '14:30',
            'location' => 'Berlin – Test Center Mitte',
            'capacity' => 25,
        ], $token);

        self::assertResponseStatusCodeSame(201);
        self::assertIsString($data['id']);
        self::assertResponseHeaderSame('Location', '/api/sessions/'.$data['id']);
        self::assertSame('German', $data['language']);
        self::assertSame('2030-01-20', $data['date']);
        self::assertSame('14:30', $data['time']);
        self::assertSame('2030-01-20T14:30:00+01:00', $data['scheduledAt']);
        self::assertSame(25, $data['seatsAvailable']);
    }

    public function testACandidateCannotManageTheCatalogue(): void
    {
        $id = $this->createSession();
        $token = $this->createUserAndLogin();

        $data = $this->requestJson('POST', '/api/sessions', $this->validPayload(), $token);
        self::assertResponseStatusCodeSame(403);
        self::assertSame('forbidden', $data['code']);

        $this->requestJson('PUT', '/api/sessions/'.$id, $this->validPayload(), $token);
        self::assertResponseStatusCodeSame(403);

        $this->requestJson('DELETE', '/api/sessions/'.$id, token: $token);
        self::assertResponseStatusCodeSame(403);
    }

    public function testInvalidSessionsAreRejected(): void
    {
        $token = $this->createUserAndLogin('admin@example.com', [Role::Admin]);

        $data = $this->requestJson('POST', '/api/sessions', [
            'language' => '',
            'date' => '2030-13-45',
            'time' => '25:00',
            'location' => '',
            'capacity' => 0,
        ], $token);

        self::assertResponseStatusCodeSame(422);
        self::assertIsArray($data['violations']);
        self::assertEqualsCanonicalizing(
            ['language', 'date', 'time', 'location', 'capacity'],
            array_values(array_unique(array_column($data['violations'], 'field'))),
        );
    }

    public function testASessionCannotBeScheduledInThePast(): void
    {
        $token = $this->createUserAndLogin('admin@example.com', [Role::Admin]);

        $data = $this->requestJson('POST', '/api/sessions', ['date' => '2020-01-01'] + $this->validPayload(), $token);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('session_in_past', $data['code']);
    }

    public function testAnAdministratorUpdatesASession(): void
    {
        $id = $this->createSession();
        $token = $this->createUserAndLogin('admin@example.com', [Role::Admin]);

        $data = $this->requestJson('PUT', '/api/sessions/'.$id, ['capacity' => 40, 'location' => 'Lyon'] + $this->validPayload(), $token);

        self::assertResponseIsSuccessful();
        self::assertSame(40, $data['capacity']);
        self::assertSame('Lyon', $data['location']);
    }

    public function testTheCapacityCannotDropBelowBookedSeats(): void
    {
        $id = $this->createSession(capacity: 20);
        $this->setSeatsTaken($id, 15);
        $token = $this->createUserAndLogin('admin@example.com', [Role::Admin]);

        $data = $this->requestJson('PUT', '/api/sessions/'.$id, ['capacity' => 10] + $this->validPayload(), $token);

        self::assertResponseStatusCodeSame(409);
        self::assertSame('capacity_below_reserved_seats', $data['code']);
    }

    public function testAnAdministratorDeletesASessionWithoutBookings(): void
    {
        $id = $this->createSession();
        $token = $this->createUserAndLogin('admin@example.com', [Role::Admin]);

        $this->requestJson('DELETE', '/api/sessions/'.$id, token: $token);
        self::assertResponseStatusCodeSame(204);

        $this->requestJson('GET', '/api/sessions/'.$id, token: $token);
        self::assertResponseStatusCodeSame(404);
    }

    public function testASessionWithBookingsCannotBeDeleted(): void
    {
        $id = $this->createSession();
        $this->setSeatsTaken($id, 1);
        $token = $this->createUserAndLogin('admin@example.com', [Role::Admin]);

        $data = $this->requestJson('DELETE', '/api/sessions/'.$id, token: $token);

        self::assertResponseStatusCodeSame(409);
        self::assertSame('session_has_reservations', $data['code']);
    }

    /**
     * @return array{language: string, date: string, time: string, location: string, capacity: int}
     */
    private function validPayload(): array
    {
        return [
            'language' => 'English',
            'date' => (new \DateTimeImmutable('+30 days'))->format('Y-m-d'),
            'time' => '10:00',
            'location' => 'Paris',
            'capacity' => 20,
        ];
    }

    private function totalOf(string $uri, string $token): int
    {
        $data = $this->requestJson('GET', $uri, token: $token);
        self::assertResponseIsSuccessful();
        self::assertIsArray($data['pagination']);
        self::assertIsInt($data['pagination']['totalItems']);

        return $data['pagination']['totalItems'];
    }
}
