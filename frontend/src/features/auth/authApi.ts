import { baseApi } from "@/services/http/baseApi";
import type { Credentials, LoginResponse, UserProfile } from "@/types/api";

export interface RegistrationPayload {
  name: string;
  email: string;
  password: string;
}

export interface ProfilePayload {
  name: string;
  email: string;
}

import { profileUpdated, signedIn } from "./authSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, Credentials>({
      query: (credentials) => ({ url: "/api/auth/login", method: "POST", data: credentials }),
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(signedIn(data.user));
        } catch {
          // The error is exposed to the form through the mutation result.
        }
      },
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/api/auth/logout", method: "POST" }),
    }),
    register: build.mutation<UserProfile, RegistrationPayload>({
      query: (payload) => ({ url: "/api/auth/register", method: "POST", data: payload }),
    }),
    updateMe: build.mutation<UserProfile, ProfilePayload>({
      query: (payload) => ({ url: "/api/me", method: "PUT", data: payload }),
      // The API answers with the updated profile: write it to the cache directly
      // instead of invalidating it, which would cost a second request.
      async onQueryStarted(_payload, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(profileUpdated(data));
          dispatch(authApi.util.upsertQueryData("getMe", undefined, data));
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
          // Session problems are handled globally (session expired).
        }
      },
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useUpdateMeMutation, useGetMeQuery } = authApi;
