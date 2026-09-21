import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingScreen } from "@/components/molecules/LoadingScreen";

import { SessionsScreen } from "./SessionsScreen";

export const metadata: Metadata = { title: "Test sessions" };

export default function SessionsPage() {
  // The screen reads its filters from the URL (useSearchParams).
  return (
    <Suspense fallback={<LoadingScreen label="Loading sessions…" />}>
      <SessionsScreen />
    </Suspense>
  );
}
