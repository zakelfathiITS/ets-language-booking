import { authApi } from "@/features/auth/authApi";
import { AUTH_STORAGE_KEY, restoreSession } from "@/features/auth/authPersistence";
import { profileUpdated, selectIsAdmin, signedOut } from "@/features/auth/authSlice";
import { sessionExpired } from "@/services/http/sessionEvents";
import { makeStore } from "@/store/store";

import { admin, anonymous, candidate, makeToken, signedIn } from "@tests/fixtures";

function persisted(): unknown {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  return raw ? JSON.parse(raw) : null;
}

describe("auth session", () => {
  it("signs in through the API and persists the session", async () => {
    const store = makeStore(anonymous);

    await store.dispatch(authApi.endpoints.login.initiate({ email: candidate.email, password: "secret" }));

    expect(store.getState().auth).toMatchObject({ status: "authenticated", user: candidate });
    expect(persisted()).toMatchObject({ user: candidate });
  });

  it("restores a persisted session whose token is still valid", () => {
    const token = makeToken(600);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user: admin }));
    const store = makeStore();

    store.dispatch(restoreSession());

    expect(store.getState().auth).toEqual({ status: "authenticated", token, user: admin, endedBy: null });
    expect(selectIsAdmin(store.getState())).toBe(true);
  });

  it("drops a persisted session whose token has expired", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: makeToken(-1), user: candidate }));
    const store = makeStore();

    store.dispatch(restoreSession());

    expect(store.getState().auth.status).toBe("anonymous");
    expect(persisted()).toBeNull();
  });

  it("starts anonymous when nothing is persisted", () => {
    const store = makeStore();
    expect(store.getState().auth.status).toBe("unknown");

    store.dispatch(restoreSession());

    expect(store.getState().auth.status).toBe("anonymous");
  });

  it.each([
    ["signing out", signedOut(), "user"],
    ["an expired session", sessionExpired(), "expiry"],
  ] as const)("forgets everything on %s", (_label, action, endedBy) => {
    const store = makeStore(signedIn());
    store.dispatch(profileUpdated(candidate));
    expect(persisted()).not.toBeNull();

    store.dispatch(action);

    expect(store.getState().auth).toEqual({ ...anonymous.auth, endedBy });
    expect(persisted()).toBeNull();
  });

  it("keeps the profile up to date", () => {
    const store = makeStore(signedIn());

    store.dispatch(profileUpdated({ ...candidate, name: "Camille Durand" }));

    expect(store.getState().auth.user?.name).toBe("Camille Durand");
  });
});
