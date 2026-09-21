import { baseApi } from "@/services/http/baseApi";
import type { TestSession } from "@/types/api";

export interface SessionPayload {
  language: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
}

/** Catalogue management (administrators only; enforced by the API). */
const adminSessionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSession: build.query<TestSession, string>({
      query: (id) => ({ url: `/api/sessions/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Session", id }],
    }),
    createSession: build.mutation<TestSession, SessionPayload>({
      query: (payload) => ({ url: "/api/sessions", method: "POST", data: payload }),
      invalidatesTags: [{ type: "Session", id: "LIST" }, "Language"],
    }),
    updateSession: build.mutation<TestSession, SessionPayload & { id: string }>({
      query: ({ id, ...payload }) => ({ url: `/api/sessions/${id}`, method: "PUT", data: payload }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Session", id }, { type: "Session", id: "LIST" }, "Language"],
    }),
    deleteSession: build.mutation<void, string>({
      query: (id) => ({ url: `/api/sessions/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Session", id }, { type: "Session", id: "LIST" }, "Language"],
    }),
  }),
});

export const { useGetSessionQuery, useCreateSessionMutation, useUpdateSessionMutation, useDeleteSessionMutation } =
  adminSessionsApi;
