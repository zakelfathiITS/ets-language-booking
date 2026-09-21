import type { AuthState } from "@/features/auth/authSlice";
import type { Paginated, Reservation, TestSession, UserProfile } from "@/types/api";

export const candidate: UserProfile = {
  id: "6ab11f30a428d1b92a0028c3",
  name: "Camille Martin",
  email: "candidate@ets.test",
  roles: ["ROLE_USER"],
  createdAt: "2026-09-01T10:00:00+00:00",
};

export const admin: UserProfile = {
  id: "6ab11f30a428d1b92a0028c2",
  name: "Alex Admin",
  email: "admin@ets.test",
  roles: ["ROLE_USER", "ROLE_ADMIN"],
  createdAt: "2026-09-01T10:00:00+00:00",
};

export function signedIn(user: UserProfile = candidate): { auth: AuthState } {
  return { auth: { status: "authenticated", user, endedBy: null } };
}

export const anonymous: { auth: AuthState } = { auth: { status: "anonymous", user: null, endedBy: null } };

export function aSession(overrides: Partial<TestSession> = {}): TestSession {
  return {
    id: "65f0000000000000000000a1",
    language: "English",
    date: "2030-09-23",
    time: "09:00",
    timezone: "Europe/Paris",
    scheduledAt: "2030-09-23T09:00:00+02:00",
    location: "Paris – Test Center La Défense",
    capacity: 8,
    seatsTaken: 2,
    seatsAvailable: 6,
    isFull: false,
    hasStarted: false,
    myReservationId: null,
    ...overrides,
  };
}

export function aReservation(overrides: Partial<Reservation> = {}, session: Partial<TestSession> = {}): Reservation {
  const id = overrides.id ?? "65f0000000000000000000r1";

  return {
    id,
    reservedAt: "2030-09-01T10:00:00+02:00",
    canBeCancelled: !session.hasStarted,
    session: aSession({ myReservationId: id, ...session }),
    ...overrides,
  };
}

export function aPage(items: TestSession[], page = 1, totalPages = 1): Paginated<TestSession> {
  return {
    items,
    pagination: {
      page,
      limit: 10,
      totalItems: totalPages * 10,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
