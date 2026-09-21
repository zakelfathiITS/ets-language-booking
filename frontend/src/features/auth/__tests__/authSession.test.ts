import { http, HttpResponse } from "msw";

import { authApi } from "@/features/auth/authApi";
import { restoreSession, SESSION_HINT_KEY, signOut } from "@/features/auth/authSession";
import { profileUpdated, selectIsAdmin } from "@/features/auth/authSlice";
import { sessionExpired } from "@/services/http/sessionEvents";
import { makeStore } from "@/store/store";

import { admin, anonymous, candidate, signedIn } from "@tests/fixtures";
import { api, problem } from "@tests/msw/handlers";
import { server } from "@tests/msw/server";

const hint = () => localStorage.getItem(SESSION_HINT_KEY);

describe("auth session", () => {
  it("signs in through the API, keeping only a hint in the browser", async () => {
    const store = makeStore(anonymous);

    await store.dispatch(authApi.endpoints.login.initiate({ email: candidate.email, password: "secret" }));

    expect(store.getState().auth).toEqual({ status: "authenticated", user: candidate, endedBy: null });
    expect(hint()).toBe("true");
    expect(JSON.stringify(localStorage)).not.toContain(candidate.email);
  });

  it("restores the session of a returning visitor from the API", async () => {
    localStorage.setItem(SESSION_HINT_KEY, "true");
    server.use(http.get(api("/api/me"), () => HttpResponse.json(admin)));
    const store = makeStore();

    await store.dispatch(restoreSession());

    expect(store.getState().auth).toEqual({ status: "authenticated", user: admin, endedBy: null });
    expect(selectIsAdmin(store.getState())).toBe(true);
  });

  it("starts anonymous when the token cookie is gone or no longer valid", async () => {
    localStorage.setItem(SESSION_HINT_KEY, "true");
    server.use(http.get(api("/api/me"), () => problem(401, "token_missing")));
    const store = makeStore();

    await store.dispatch(restoreSession());

    expect(store.getState().auth).toEqual(anonymous.auth);
    expect(hint()).toBeNull();
  });

  it("does not call the API for a visitor who never signed in", async () => {
    const onMe = jest.fn();
    server.use(http.get(api("/api/me"), onMe));
    const store = makeStore();
    expect(store.getState().auth.status).toBe("unknown");

    await store.dispatch(restoreSession());

    expect(store.getState().auth.status).toBe("anonymous");
    expect(onMe).not.toHaveBeenCalled();
  });

  it("revokes the token when signing out", async () => {
    const onLogout = jest.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(http.post(api("/api/auth/logout"), onLogout));
    localStorage.setItem(SESSION_HINT_KEY, "true");
    const store = makeStore(signedIn());

    await store.dispatch(signOut());

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(store.getState().auth).toEqual({ ...anonymous.auth, endedBy: "user" });
    expect(hint()).toBeNull();
  });

  it("signs out locally even if the API cannot be reached", async () => {
    server.use(http.post(api("/api/auth/logout"), () => HttpResponse.error()));
    const store = makeStore(signedIn());

    await store.dispatch(signOut());

    expect(store.getState().auth).toEqual({ ...anonymous.auth, endedBy: "user" });
  });

  it("forgets everything when the session expires", () => {
    localStorage.setItem(SESSION_HINT_KEY, "true");
    const store = makeStore(signedIn());

    store.dispatch(sessionExpired());

    expect(store.getState().auth).toEqual({ ...anonymous.auth, endedBy: "expiry" });
    expect(hint()).toBeNull();
  });

  it("keeps the profile up to date", () => {
    const store = makeStore(signedIn());

    store.dispatch(profileUpdated({ ...candidate, name: "Camille Durand" }));

    expect(store.getState().auth.user?.name).toBe("Camille Durand");
  });
});
