import { http, HttpResponse } from "msw";

import { authApi } from "@/features/auth/authApi";
import { AUTH_STORAGE_KEY } from "@/features/auth/authPersistence";
import { makeStore } from "@/store/store";

import { anonymous, candidate, signedIn } from "../../../../test/fixtures";
import { api, problem } from "../../../../test/msw/handlers";
import { server } from "../../../../test/msw/server";

describe("axiosBaseQuery", () => {
  it("sends the access token as a Bearer header", async () => {
    let authorization: string | null = null;
    server.use(
      http.get(api("/api/me"), ({ request }) => {
        authorization = request.headers.get("Authorization");

        return HttpResponse.json(candidate);
      }),
    );
    const state = signedIn();
    const store = makeStore(state);

    await store.dispatch(authApi.endpoints.getMe.initiate());

    expect(authorization).toBe(`Bearer ${state.auth.token}`);
  });

  it.each(["token_expired", "token_invalid"])("signs the user out when the API answers %s", async (code) => {
    server.use(http.get(api("/api/me"), () => problem(401, code)));
    const store = makeStore(signedIn());
    localStorage.setItem(AUTH_STORAGE_KEY, "{}");

    // Signing out also wipes the API cache, this request included: only the
    // resulting session state matters here.
    await store.dispatch(authApi.endpoints.getMe.initiate());

    expect(store.getState().auth).toEqual({ ...anonymous.auth, endedBy: "expiry" });
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("does not sign anybody out when credentials are wrong", async () => {
    server.use(http.post(api("/api/auth/login"), () => problem(401, "invalid_credentials", "Invalid email or password.")));
    const store = makeStore(anonymous);

    const result = await store.dispatch(authApi.endpoints.login.initiate({ email: "a@b.c", password: "nope" }));

    expect(result.error).toMatchObject({ code: "invalid_credentials", message: "Invalid email or password." });
    expect(store.getState().auth.status).toBe("anonymous");
  });
});
