import { type NextRequest, NextResponse } from "next/server";

import { contentSecurityPolicy } from "@/lib/contentSecurityPolicy";

/**
 * A fresh nonce for every page: Next.js reads it from the request's
 * Content-Security-Policy header and adds it to the scripts it renders.
 */
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const policy = contentSecurityPolicy(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", policy);

  return response;
}

export const config = {
  // Pages only: not the API relay, static files or prefetches.
  matcher: [
    {
      source: "/((?!api/|_next/static|_next/image|icon.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
