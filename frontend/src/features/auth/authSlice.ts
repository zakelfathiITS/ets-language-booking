import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { sessionExpired } from "@/services/http/sessionEvents";
import type { UserProfile } from "@/types/api";

/**
 * "unknown" until the persisted session has been read on the client, so that
 * guards never flash protected content nor redirect too early.
 */
export type AuthStatus = "unknown" | "authenticated" | "anonymous";

export interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: UserProfile | null;
}

export interface Session {
  token: string;
  user: UserProfile;
}

const initialState: AuthState = { status: "unknown", token: null, user: null };

function signOut(state: AuthState): void {
  state.status = "anonymous";
  state.token = null;
  state.user = null;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<Session>) {
      state.status = "authenticated";
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    sessionRestored(state, action: PayloadAction<Session>) {
      state.status = "authenticated";
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    noSessionToRestore: signOut,
    signedOut: signOut,
    profileUpdated(state, action: PayloadAction<UserProfile>) {
      if (state.status === "authenticated") {
        state.user = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sessionExpired, signOut);
  },
  selectors: {
    selectAuthStatus: (state) => state.status,
    selectCurrentUser: (state) => state.user,
    selectIsAdmin: (state) => state.user?.roles.includes("ROLE_ADMIN") ?? false,
  },
});

export const { signedIn, sessionRestored, noSessionToRestore, signedOut, profileUpdated } = authSlice.actions;
export const { selectAuthStatus, selectCurrentUser, selectIsAdmin } = authSlice.selectors;
export const authReducer = authSlice.reducer;
