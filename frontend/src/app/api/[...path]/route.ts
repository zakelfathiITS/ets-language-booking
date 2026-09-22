import { forwardToApi } from "@/lib/apiProxy";

/**
 * Every /api/* call of the browser, relayed to the Symfony API (see lib/apiProxy).
 * Read at request time, so one image serves every environment.
 */
function relay(request: Request): Promise<Response> {
  return forwardToApi(request, {
    apiUrl: process.env.API_INTERNAL_URL ?? "http://localhost:8000",
    secret: process.env.API_PROXY_SECRET,
  });
}

export { relay as DELETE, relay as GET, relay as PATCH, relay as POST, relay as PUT };

/** Seconds a hosted function may wait: an API on a free plan takes up to a minute to wake up. */
export const maxDuration = 60;
