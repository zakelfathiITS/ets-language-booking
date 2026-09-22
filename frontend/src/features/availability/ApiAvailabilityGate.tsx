"use client";

import type { ReactNode } from "react";

import { WakeUpScreen } from "@/components/organisms/WakeUpScreen";
import { useAppSelector } from "@/store/hooks";

import { selectApiAvailability } from "./availabilitySlice";

/** While the API wakes up, says so instead of showing screens that cannot work yet. */
export function ApiAvailabilityGate({ children }: { children: ReactNode }) {
  const availability = useAppSelector(selectApiAvailability);

  return availability === "waking" ? <WakeUpScreen /> : children;
}
