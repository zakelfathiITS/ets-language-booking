"use client";

import { useCallback } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { signOut } from "./authSession";
import { selectAuthStatus, selectCurrentUser, selectIsAdmin, selectSessionEnd } from "./authSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const sessionEnd = useAppSelector(selectSessionEnd);

  const logout = useCallback(() => {
    void dispatch(signOut());
  }, [dispatch]);

  return { status, user, isAdmin, sessionEnd, isAuthenticated: status === "authenticated", logout };
}
