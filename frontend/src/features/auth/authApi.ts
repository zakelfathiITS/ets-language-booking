import { baseApi } from "@/services/http/baseApi";
import type { Credentials, LoginResponse, UserProfile } from "@/types/api";

import { profileUpdated, signedIn } from "./authSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, Credentials>({
      query: (credentials) => ({ url: "/api/auth/login", method: "POST", data: credentials }),
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(signedIn(data));
        } catch {
          // The error is exposed to the form through the mutation result.
        }
      },
    }),
    getMe: build.query<UserProfile, void>({
      query: () => ({ url: "/api/me" }),
      providesTags: ["Me"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(profileUpdated(data));
        } catch {
          // Token problems are handled globally (session expired).
        }
      },
    }),
  }),
});

export const { useLoginMutation, useGetMeQuery } = authApi;
