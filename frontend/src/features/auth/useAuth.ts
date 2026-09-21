"use client";

import { useCallback } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { selectAuthStatus, selectCurrentUser, selectIsAdmin, signedOut } from "./authSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);

  const logout = useCallback(() => {
    dispatch(signedOut());
  }, [dispatch]);

  return { status, user, isAdmin, isAuthenticated: status === "authenticated", logout };
}
