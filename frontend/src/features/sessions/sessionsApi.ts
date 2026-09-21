import { baseApi } from "@/services/http/baseApi";
import type { Collection, Paginated, TestSession } from "@/types/api";

export interface SessionListParams {
  page: number;
  limit?: number;
  language?: string | null;
  availableOnly?: boolean;
  includePast?: boolean;
}

/** Drops empty filters so they do not end up in the query string. */
function toQueryParams({ page, limit, language, availableOnly, includePast }: SessionListParams) {
  return {
    page,
    ...(limit ? { limit } : {}),
    ...(language ? { language } : {}),
    ...(availableOnly ? { availableOnly: true } : {}),
    ...(includePast ? { includePast: true } : {}),
  };
}

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSessions: build.query<Paginated<TestSession>, SessionListParams>({
      query: (params) => ({ url: "/api/sessions", params: toQueryParams(params) }),
      providesTags: (result) => [
        { type: "Session", id: "LIST" },
        ...(result?.items.map((session) => ({ type: "Session" as const, id: session.id })) ?? []),
      ],
    }),
    listLanguages: build.query<Collection<string>, void>({
      query: () => ({ url: "/api/sessions/languages" }),
      providesTags: ["Language"],
    }),
  }),
});

export const { useListSessionsQuery, useListLanguagesQuery } = sessionsApi;
