import { createListenerMiddleware, type Dispatch, isAnyOf } from "@reduxjs/toolkit";

import { isTokenExpired } from "@/lib/jwt";
import { storage } from "@/lib/storage";
import { baseApi } from "@/services/http/baseApi";
import { sessionExpired } from "@/services/http/sessionEvents";

import {
  type AuthState,
  noSessionToRestore,
  profileUpdated,
  type Session,
  sessionRestored,
  signedIn,
  signedOut,
} from "./authSlice";

export const AUTH_STORAGE_KEY = "ets.auth";

/**
 * Keeps the session in localStorage so it survives a page reload, and wipes
 * cached API data on sign-out so the next user never sees the previous one's.
 */
export const authListener = createListenerMiddleware();

authListener.startListening({
  matcher: isAnyOf(signedIn, sessionRestored, profileUpdated),
  effect: (_action, api) => {
    const { token, user } = (api.getState() as { auth: AuthState }).auth;
    if (token && user) {
      storage.write(AUTH_STORAGE_KEY, { token, user } satisfies Session);
    }
  },
});

authListener.startListening({
  matcher: isAnyOf(signedOut, sessionExpired),
  effect: (_action, api) => {
    storage.remove(AUTH_STORAGE_KEY);
    api.dispatch(baseApi.util.resetApiState());
  },
});

/** Restores the persisted session, unless its token has already expired. */
export function restoreSession() {
  return (dispatch: Dispatch): void => {
    const saved = storage.read<Session>(AUTH_STORAGE_KEY);

    if (saved?.token && saved.user && !isTokenExpired(saved.token)) {
      dispatch(sessionRestored(saved));

      return;
    }

    storage.remove(AUTH_STORAGE_KEY);
    dispatch(noSessionToRestore());
  };
}
