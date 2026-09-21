import { http, HttpResponse } from "msw";

import { API_URL } from "@/lib/env";
import type { Problem } from "@/types/api";

import { aPage, aSession, candidate, makeToken } from "../fixtures";

export const api = (path: string) => `${API_URL}${path}`;

export function problem(status: number, code: string, detail = code, violations?: Problem["violations"]) {
  return HttpResponse.json<Problem>(
    { type: "about:blank", title: code, status, code, detail, ...(violations ? { violations } : {}) },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

/** Default happy-path API; tests override what they need with server.use(). */
export const handlers = [
  http.post(api("/api/auth/login"), () => HttpResponse.json({ token: makeToken(), user: candidate })),
  http.get(api("/api/me"), () => HttpResponse.json(candidate)),
  http.get(api("/api/sessions"), () => HttpResponse.json(aPage([aSession()]))),
  http.get(api("/api/sessions/languages"), () => HttpResponse.json({ items: ["English", "French"] })),
  http.get(api("/api/reservations"), () => HttpResponse.json({ items: [] })),
];
