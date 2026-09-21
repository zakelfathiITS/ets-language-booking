import { http, HttpResponse } from "msw";

import { authApi } from "@/features/auth/authApi";
import { SESSION_HINT_KEY } from "@/features/auth/authSession";
import { makeStore } from "@/store/store";

import { anonymous, candidate, signedIn } from "@tests/fixtures";
import { api, problem } from "@tests/msw/handlers";
import { server } from "@tests/msw/server";

describe("axiosBaseQuery", () => {
  it("never handles the token itself: its httpOnly cookie travels on its own", async () => {
    let authorization: string | null = "unset";
    let language: string | null = null;
    server.use(
      http.get(api("/api/me"), ({ request }) => {
        authorization = request.headers.get("Authorization");
        language = request.headers.get("Accept-Language");

        return HttpResponse.json(candidate);
      }),
    );
    document.documentElement.lang = "fr";
    const store = makeStore(signedIn());

    await store.dispatch(authApi.endpoints.getMe.initiate());

    expect(authorization).toBeNull();
    expect(language).toBe("fr");
    document.documentElement.lang = "";
  });

  it.each(["token_expired", "token_invalid", "token_missing"])("signs the user out when the API answers %s", async (code) => {
    server.use(http.get(api("/api/me"), () => problem(401, code)));
    const store = makeStore(signedIn());
    localStorage.setItem(SESSION_HINT_KEY, "true");

    // Signing out also wipes the API cache, this request included: only the
    // resulting session state matters here.
    await store.dispatch(authApi.endpoints.getMe.initiate());

    expect(store.getState().auth).toEqual({ ...anonymous.auth, endedBy: "expiry" });
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull();
  });

  it("does not sign anybody out when credentials are wrong", async () => {
    server.use(http.post(api("/api/auth/login"), () => problem(401, "invalid_credentials", "Invalid email or password.")));
    const store = makeStore(anonymous);

    const result = await store.dispatch(authApi.endpoints.login.initiate({ email: "a@b.c", password: "nope" }));

    expect(result.error).toMatchObject({ code: "invalid_credentials", message: "Invalid email or password." });
    expect(store.getState().auth.status).toBe("anonymous");
  });
});
