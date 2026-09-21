import type { AuthState } from "@/features/auth/authSlice";
import type { UserProfile } from "@/types/api";

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

/** An unsigned JWT: enough for the client, which never verifies signatures. */
export function makeToken(expiresInSeconds = 3600, sub = candidate.id): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, "");
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ sub, exp })}.signature`;
}

export function signedIn(user: UserProfile = candidate, token: string = makeToken()): { auth: AuthState } {
  return { auth: { status: "authenticated", token, user, endedBy: null } };
}

export const anonymous: { auth: AuthState } = { auth: { status: "anonymous", token: null, user: null, endedBy: null } };
