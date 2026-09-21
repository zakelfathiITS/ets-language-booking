import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingScreen } from "@/components/molecules/LoadingScreen";

import { AdminSessionsScreen } from "./AdminSessionsScreen";

export const metadata: Metadata = { title: "Manage sessions" };

export default function AdminSessionsPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading sessions…" />}>
      <AdminSessionsScreen />
    </Suspense>
  );
}
