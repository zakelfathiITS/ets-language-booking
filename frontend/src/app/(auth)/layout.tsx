"use client";

import { Suspense } from "react";

import { LoadingScreen } from "@/components/molecules/LoadingScreen";
import { RedirectIfAuthenticated } from "@/features/auth/guards";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<LoadingScreen label="Loading…" />}>
      <RedirectIfAuthenticated>{children}</RedirectIfAuthenticated>
    </Suspense>
  );
}
