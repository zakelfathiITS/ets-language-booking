"use client";

import { useCallback } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { type Flash, flashCleared, flashed, selectFlash } from "./flashSlice";

export function useFlash() {
  const dispatch = useAppDispatch();
  const flash = useAppSelector(selectFlash);

  const show = useCallback(
    (message: Flash) => {
      dispatch(flashed(message));
    },
    [dispatch],
  );
  const clear = useCallback(() => {
    dispatch(flashCleared());
  }, [dispatch]);

  return { flash, show, clear };
}
