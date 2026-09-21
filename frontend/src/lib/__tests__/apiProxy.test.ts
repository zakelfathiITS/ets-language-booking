/**
 * @jest-environment node
 */
import { http, HttpResponse } from "msw";

import { forwardToApi, MAX_BODY_BYTES } from "@/lib/apiProxy";

import { server } from "@tests/msw/server";

const config = { apiUrl: "http://backend", secret: "shared-secret" };

function browserRequest(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost:3000${path}`, init);
}

describe("forwardToApi", () => {
  it("relays the call to the API with only the headers the API needs", async () => {
    let received: Request | undefined;
    let body = "";
    server.use(
      http.put("http://backend/api/me", async ({ request }) => {
        received = request;
        body = await request.text();

        return HttpResponse.json({ ok: true });
      }),
    );

    const response = await forwardToApi(
      browserRequest("/api/me?x=1", {
        method: "PUT",
        body: '{"name":"Jane"}',
        headers: {
          "content-type": "application/json",
          "accept-language": "fr",
          cookie: "ets_token=abc",
          authorization: "Bearer injected",
          "x-client-ip": "6.6.6.6",
          "x-forwarded-for": "203.0.113.7, 10.0.0.1",
        },
      }),
      config,
    );

    expect(response.status).toBe(200);
    expect(new URL(received!.url).search).toBe("?x=1");
    expect(body).toBe('{"name":"Jane"}');
    expect(received!.headers.get("cookie")).toBe("ets_token=abc");
    expect(received!.headers.get("accept-language")).toBe("fr");
    expect(received!.headers.get("authorization")).toBeNull();
    // The visitor's address comes from the platform, never from the visitor.
    expect(received!.headers.get("x-client-ip")).toBe("203.0.113.7");
    expect(received!.headers.get("x-proxy-secret")).toBe("shared-secret");
  });

  it("forwards no address without a shared secret", async () => {
    let received: Request | undefined;
    server.use(
      http.get("http://backend/api/health", ({ request }) => {
        received = request;

        return HttpResponse.json({});
      }),
    );

    await forwardToApi(browserRequest("/api/health", { headers: { "x-forwarded-for": "203.0.113.7" } }), { apiUrl: "http://backend" });

    expect(received!.headers.get("x-client-ip")).toBeNull();
    expect(received!.headers.get("x-proxy-secret")).toBeNull();
  });

  it("relays the answer, cookies included, without revealing the API's software", async () => {
    server.use(
      http.post("http://backend/api/auth/login", () => {
        const headers = new Headers({ "retry-after": "60", server: "FrankenPHP Caddy", "x-powered-by": "PHP/8.3" });
        headers.append("set-cookie", "ets_token=abc; Path=/api; HttpOnly; SameSite=Strict");
        headers.append("set-cookie", "other=1; Path=/");

        return HttpResponse.json({ user: {} }, { status: 201, headers });
      }),
    );

    const response = await forwardToApi(browserRequest("/api/auth/login", { method: "POST", body: "{}" }), config);

    expect(response.status).toBe(201);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("server")).toBeNull();
    expect(response.headers.get("x-powered-by")).toBeNull();
    expect(response.headers.getSetCookie()).toEqual(["ets_token=abc; Path=/api; HttpOnly; SameSite=Strict", "other=1; Path=/"]);
    await expect(response.json()).resolves.toEqual({ user: {} });
  });

  it("only reaches the API routes", async () => {
    const response = await forwardToApi(browserRequest("/api/%2e%2e/bundles/secret.txt"), config);

    expect(response.status).toBe(404);
  });

  it("refuses oversized bodies", async () => {
    const response = await forwardToApi(
      browserRequest("/api/me", { method: "PUT", body: "x".repeat(MAX_BODY_BYTES + 1) }),
      config,
    );

    expect(response.status).toBe(413);
  });

  it("answers with a problem when the API cannot be reached", async () => {
    server.use(http.get("http://backend/api/sessions", () => HttpResponse.error()));

    const response = await forwardToApi(browserRequest("/api/sessions"), config);

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toBe("application/problem+json");
    await expect(response.json()).resolves.toMatchObject({ code: "api_unavailable" });
  });
});
