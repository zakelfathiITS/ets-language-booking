import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";

import { storage } from "@/lib/storage";
import { baseApi } from "@/services/http/baseApi";
import { sessionExpired } from "@/services/http/sessionEvents";
import type { AppDispatch } from "@/store/store";

import { authApi } from "./authApi";
import { noSessionToRestore, sessionRestored, signedIn, signedOut } from "./authSlice";

/**
 * Remembers that someone signed in on this browser, so a returning visitor's
 * session is checked with the API while newcomers are spared a request that
 * could only fail. A hint, not a secret: the token stays in its httpOnly cookie.
 */
export const SESSION_HINT_KEY = "ets.signedIn";

export const authListener = createListenerMiddleware();

authListener.startListening({
  matcher: isAnyOf(signedIn, sessionRestored),
  effect: () => storage.write(SESSION_HINT_KEY, true),
});

authListener.startListening({
  matcher: isAnyOf(noSessionToRestore, signedOut, sessionExpired),
  effect: () => storage.remove(SESSION_HINT_KEY),
});

// Wipes cached API data, so the next user never sees the previous one's.
authListener.startListening({
  matcher: isAnyOf(signedOut, sessionExpired),
  effect: (_action, api) => {
    api.dispatch(baseApi.util.resetApiState());
  },
});

/** On start-up: asks the API who the token cookie belongs to, if anyone. */
export function restoreSession() {
  return async (dispatch: AppDispatch): Promise<void> => {
    if (!storage.read<boolean>(SESSION_HINT_KEY)) {
      dispatch(noSessionToRestore());

      return;
    }

    const { data } = await dispatch(authApi.endpoints.getMe.initiate(undefined, { subscribe: false, forceRefetch: true }));
    dispatch(data ? sessionRestored(data) : noSessionToRestore());
  };
}

/** Revokes the token on the API side, then forgets the session here, whatever the API said. */
export function signOut() {
  return async (dispatch: AppDispatch): Promise<void> => {
    await dispatch(authApi.endpoints.logout.initiate());
    dispatch(signedOut());
  };
}
