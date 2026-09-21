import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { sessionExpired } from "@/services/http/sessionEvents";
import type { UserProfile } from "@/types/api";

/**
 * "unknown" until the session has been checked with the API, so that guards
 * never flash protected content nor redirect too early.
 *
 * The token itself never reaches this state: it lives in an httpOnly cookie
 * that scripts cannot read.
 */
export type AuthStatus = "unknown" | "authenticated" | "anonymous";

/** How the last session ended: drives where, and with which message, users land. */
export type SessionEnd = "user" | "expiry" | null;

export interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  endedBy: SessionEnd;
}

const initialState: AuthState = { status: "unknown", user: null, endedBy: null };

function signIn(state: AuthState, user: UserProfile): void {
  state.status = "authenticated";
  state.user = user;
  state.endedBy = null;
}

function signOut(state: AuthState, endedBy: SessionEnd): void {
  state.status = "anonymous";
  state.user = null;
  state.endedBy = endedBy;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedIn: (state, action: PayloadAction<UserProfile>) => signIn(state, action.payload),
    sessionRestored: (state, action: PayloadAction<UserProfile>) => signIn(state, action.payload),
    noSessionToRestore: (state) => signOut(state, null),
    signedOut: (state) => signOut(state, "user"),
    profileUpdated(state, action: PayloadAction<UserProfile>) {
      if (state.status === "authenticated") {
        state.user = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sessionExpired, (state) => signOut(state, "expiry"));
  },
  selectors: {
    selectAuthStatus: (state) => state.status,
    selectSessionEnd: (state) => state.endedBy,
    selectCurrentUser: (state) => state.user,
    selectIsAdmin: (state) => state.user?.roles.includes("ROLE_ADMIN") ?? false,
  },
});

export const { signedIn, sessionRestored, noSessionToRestore, signedOut, profileUpdated } = authSlice.actions;
export const { selectAuthStatus, selectSessionEnd, selectCurrentUser, selectIsAdmin } = authSlice.selectors;
export const authReducer = authSlice.reducer;
