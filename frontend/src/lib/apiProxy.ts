/**
 * Server-side relay between the browser and the Symfony API.
 *
 * The browser only ever talks to this origin: the API's httpOnly token cookie
 * is first-party (SameSite=Strict holds, no CORS), and the API address is a
 * server-side setting. Only a known set of headers crosses the relay.
 */

export interface ApiProxyConfig {
  /** Base URL of the API as reached from this server, e.g. http://backend. */
  apiUrl: string;
  /** Proves to the API that the forwarded visitor address comes from here. */
  secret?: string;
}

/** Request headers the API needs; everything else stays here. */
const FORWARDED_REQUEST_HEADERS = ["accept", "accept-language", "content-type", "cookie"];

/**
 * Hop-by-hop headers, encoding headers that no longer apply once fetch() has
 * decoded the body, and what would reveal the API's software. Cookies are
 * copied separately, one by one.
 */
const DROPPED_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "server",
  "set-cookie",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "x-powered-by",
]);

/** API payloads are small JSON documents. */
export const MAX_BODY_BYTES = 64 * 1024;

export async function forwardToApi(request: Request, config: ApiProxyConfig): Promise<Response> {
  const { pathname, search } = new URL(request.url);
  const target = new URL(pathname + search, config.apiUrl);
  if (!target.pathname.startsWith("/api/")) {
    return problem(404, "not_found", "Not Found");
  }

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  if (body && body.byteLength > MAX_BODY_BYTES) {
    return problem(413, "payload_too_large", "The request body is too large.");
  }

  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers: forwardedHeaders(request.headers, config.secret),
      body,
      redirect: "manual",
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return problem(502, "api_unavailable", "The API cannot be reached.");
  }

  const headers = new Headers();
  response.headers.forEach((value, name) => {
    if (!DROPPED_RESPONSE_HEADERS.has(name)) {
      headers.set(name, value);
    }
  });
  for (const cookie of response.headers.getSetCookie()) {
    headers.append("set-cookie", cookie);
  }

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function forwardedHeaders(incoming: Headers, secret: string | undefined): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = incoming.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }

  // The visitor's address, as recorded by the hosting platform (or Next.js
  // itself when nothing stands in front of it): the API rate-limits per visitor.
  const clientIp = incoming.get("x-forwarded-for")?.split(",")[0]?.trim() || incoming.get("x-real-ip");
  if (secret && clientIp) {
    headers.set("x-client-ip", clientIp);
    headers.set("x-proxy-secret", secret);
  }

  return headers;
}

function problem(status: number, code: string, detail: string): Response {
  return Response.json(
    { type: "about:blank", title: detail, status, code, detail },
    { status, headers: { "content-type": "application/problem+json" } },
  );
}
