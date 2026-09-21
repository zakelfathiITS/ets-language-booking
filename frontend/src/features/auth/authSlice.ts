import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { sessionExpired } from "@/services/http/sessionEvents";
import type { UserProfile } from "@/types/api";

/**
 * "unknown" until the persisted session has been read on the client, so that
 * guards never flash protected content nor redirect too early.
 */
export type AuthStatus = "unknown" | "authenticated" | "anonymous";

/** How the last session ended: drives where, and with which message, users land. */
export type SessionEnd = "user" | "expiry" | null;

export interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: UserProfile | null;
  endedBy: SessionEnd;
}

export interface Session {
  token: string;
  user: UserProfile;
}

const initialState: AuthState = { status: "unknown", token: null, user: null, endedBy: null };

function signOut(state: AuthState, endedBy: SessionEnd): void {
  state.status = "anonymous";
  state.token = null;
  state.user = null;
  state.endedBy = endedBy;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<Session>) {
      state.status = "authenticated";
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.endedBy = null;
    },
    sessionRestored(state, action: PayloadAction<Session>) {
      state.status = "authenticated";
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.endedBy = null;
    },
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
