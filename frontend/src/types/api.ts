/**
 * Contract of the REST API (see /api/doc on the backend).
 */

export type Role = "ROLE_USER" | "ROLE_ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  createdAt: string;
}

export interface TestSession {
  id: string;
  language: string;
  /** Local date, YYYY-MM-DD, in `timezone`. */
  date: string;
  /** Local time, HH:MM (24h), in `timezone`. */
  time: string;
  timezone: string;
  /** Same instant as date + time, ISO 8601 with offset. */
  scheduledAt: string;
  location: string;
  capacity: number;
  seatsTaken: number;
  seatsAvailable: number;
  isFull: boolean;
  hasStarted: boolean;
  /** The current user's reservation for this session, if any. */
  myReservationId: string | null;
}

export interface Reservation {
  id: string;
  reservedAt: string;
  canBeCancelled: boolean;
  session: TestSession;
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface Collection<T> {
  items: T[];
}

export interface Credentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface ProblemViolation {
  field: string;
  message: string;
}

/** RFC 9457 Problem Details, as returned for every API error. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  violations?: ProblemViolation[];
}
