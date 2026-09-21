<?php

declare(strict_types=1);

namespace App\Tests\Functional\UI\Http\Booking;

use App\Domain\Identity\Role;
use App\Tests\Support\ApiTestCase;
use App\Tests\Support\CatalogFixtures;
use PHPUnit\Framework\Attributes\CoversNothing;

#[CoversNothing]
final class ReservationApiTest extends ApiTestCase
{
    use CatalogFixtures;

    public function testReservationsRequireAuthentication(): void
    {
        $this->requestJson('GET', '/api/reservations');
        self::assertResponseStatusCodeSame(401);

        $this->requestJson('POST', '/api/reservations', ['sessionId' => 'x']);
        self::assertResponseStatusCodeSame(401);
    }

    public function testBookingASessionTakesASeat(): void
    {
        $sessionId = $this->createSession(capacity: 3);
        $token = $this->createUserAndLogin();

        $data = $this->requestJson('POST', '/api/reservations', ['sessionId' => $sessionId], $token);

        self::assertResponseStatusCodeSame(201);
        self::assertIsString($data['id']);
        self::assertResponseHeaderSame('Location', '/api/reservations/'.$data['id']);
        self::assertTrue($data['canBeCancelled']);
        self::assertIsArray($data['session']);
        self::assertSame($sessionId, $data['session']['id']);
        self::assertSame(1, $data['session']['seatsTaken']);
        self::assertSame(2, $data['session']['seatsAvailable']);
        self::assertSame($data['id'], $data['session']['myReservationId']);
    }

    public function testTheCatalogueFlagsSessionsBookedByTheCurrentUserOnly(): void
    {
        $sessionId = $this->createSession();
        $this->createSession('French');
        $janeToken = $this->createUserAndLogin('jane@example.com');
        $reservationId = $this->book($sessionId, $janeToken);
        $johnToken = $this->createUserAndLogin('john@example.com');

        $forJane = $this->requestJson('GET', '/api/sessions', token: $janeToken);
        $forJohn = $this->requestJson('GET', '/api/sessions/'.$sessionId, token: $johnToken);

        self::assertIsArray($forJane['items']);
        self::assertSame(
            [$sessionId => $reservationId],
            array_filter(array_column($forJane['items'], 'myReservationId', 'id')),
        );
        self::assertNull($forJohn['myReservationId']);
    }

    public function testASessionCannotBeBookedTwiceByTheSameUser(): void
    {
        $sessionId = $this->createSession();
        $token = $this->createUserAndLogin();
        $this->book($sessionId, $token);

        $data = $this->requestJson('POST', '/api/reservations', ['sessionId' => $sessionId], $token);

        self::assertResponseStatusCodeSame(409);
        self::assertSame('already_reserved', $data['code']);
        self::assertSame(1, $this->sessionSeatsTaken($sessionId, $token));
    }

    public function testAFullSessionCannotBeBooked(): void
    {
        $sessionId = $this->createSession(capacity: 1);
        $this->book($sessionId, $this->createUserAndLogin('jane@example.com'));

        $data = $this->requestJson('POST', '/api/reservations', ['sessionId' => $sessionId], $this->createUserAndLogin('john@example.com'));

        self::assertResponseStatusCodeSame(409);
        self::assertSame('session_full', $data['code']);
    }

    public function testASessionThatHasStartedCannotBeBooked(): void
    {
        $sessionId = $this->createSession();
        $this->moveToThePast($sessionId);

        $data = $this->requestJson('POST', '/api/reservations', ['sessionId' => $sessionId], $this->createUserAndLogin());

        self::assertResponseStatusCodeSame(409);
        self::assertSame('session_already_started', $data['code']);
    }

    public function testBookingAnUnknownSessionIsNotFound(): void
    {
        $data = $this->requestJson('POST', '/api/reservations', ['sessionId' => 'ffffffffffffffffffffffff'], $this->createUserAndLogin());

        self::assertResponseStatusCodeSame(404);
        self::assertSame('session_not_found', $data['code']);
    }

    public function testTheSessionIdIsRequired(): void
    {
        $data = $this->requestJson('POST', '/api/reservations', [], $this->createUserAndLogin());

        self::assertResponseStatusCodeSame(422);
        self::assertIsArray($data['violations']);
        self::assertSame('sessionId', $data['violations'][0]['field'] ?? null);
    }

    public function testAUserListsOnlyTheirOwnReservations(): void
    {
        $english = $this->createSession('English', '+3 days');
        $french = $this->createSession('French', '+6 days');
        $janeToken = $this->createUserAndLogin('jane@example.com');
        $johnToken = $this->createUserAndLogin('john@example.com');
        $this->book($french, $janeToken);
        $this->book($english, $janeToken);
        $this->book($english, $johnToken);

        $data = $this->requestJson('GET', '/api/reservations', token: $janeToken);

        self::assertResponseIsSuccessful();
        self::assertIsArray($data['items']);
        self::assertSame(['English', 'French'], array_map(
            static fn (array $item): mixed => $item['session']['language'] ?? null,
            $data['items'],
        ));
    }

    public function testCancellingFreesTheSeat(): void
    {
        $sessionId = $this->createSession(capacity: 1);
        $token = $this->createUserAndLogin();
        $reservationId = $this->book($sessionId, $token);

        $this->requestJson('DELETE', '/api/reservations/'.$reservationId, token: $token);

        self::assertResponseStatusCodeSame(204);
        self::assertSame(0, $this->sessionSeatsTaken($sessionId, $token));
        self::assertSame([], $this->requestJson('GET', '/api/reservations', token: $token)['items']);

        $this->requestJson('POST', '/api/reservations', ['sessionId' => $sessionId], $this->createUserAndLogin('john@example.com'));
        self::assertResponseStatusCodeSame(201, 'The freed seat can be booked again.');
    }

    public function testAnotherUsersReservationLooksLikeItDoesNotExist(): void
    {
        $janeToken = $this->createUserAndLogin('jane@example.com');
        $reservationId = $this->book($this->createSession(), $janeToken);
        $johnToken = $this->createUserAndLogin('john@example.com');

        $shown = $this->requestJson('GET', '/api/reservations/'.$reservationId, token: $johnToken);
        self::assertResponseStatusCodeSame(404);
        self::assertSame('reservation_not_found', $shown['code']);

        $this->requestJson('DELETE', '/api/reservations/'.$reservationId, token: $johnToken);
        self::assertResponseStatusCodeSame(404);

        $this->requestJson('GET', '/api/reservations/'.$reservationId, token: $janeToken);
        self::assertResponseIsSuccessful();
    }

    public function testAReservationForASessionThatHasStartedCannotBeCancelled(): void
    {
        $sessionId = $this->createSession();
        $token = $this->createUserAndLogin();
        $reservationId = $this->book($sessionId, $token);
        $this->moveToThePast($sessionId);

        $listed = $this->requestJson('GET', '/api/reservations', token: $token);
        $data = $this->requestJson('DELETE', '/api/reservations/'.$reservationId, token: $token);

        self::assertIsArray($listed['items']);
        self::assertFalse($listed['items'][0]['canBeCancelled'] ?? null);
        self::assertResponseStatusCodeSame(409);
        self::assertSame('session_already_started', $data['code']);
    }

    public function testABookedSessionCannotBeDeletedByAnAdministrator(): void
    {
        $sessionId = $this->createSession();
        $this->book($sessionId, $this->createUserAndLogin());

        $data = $this->requestJson('DELETE', '/api/sessions/'.$sessionId, token: $this->createUserAndLogin('admin@example.com', [Role::Admin]));

        self::assertResponseStatusCodeSame(409);
        self::assertSame('session_has_reservations', $data['code']);
    }

    /**
     * Books a seat and fails the test right away if the booking is refused.
     */
    private function book(string $sessionId, string $token): string
    {
        $reservation = $this->requestJson('POST', '/api/reservations', ['sessionId' => $sessionId], $token);
        self::assertResponseStatusCodeSame(201, 'Test precondition: the booking must succeed.');
        self::assertIsString($reservation['id']);

        return $reservation['id'];
    }

    private function sessionSeatsTaken(string $sessionId, string $token): int
    {
        $session = $this->requestJson('GET', '/api/sessions/'.$sessionId, token: $token);
        self::assertIsInt($session['seatsTaken']);

        return $session['seatsTaken'];
    }
}
