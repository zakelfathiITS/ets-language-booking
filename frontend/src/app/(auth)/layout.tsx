"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { LoadingScreen } from "@/components/molecules/LoadingScreen";
import { RedirectIfAuthenticated } from "@/features/auth/guards";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  const t = useTranslations("common");

  return (
    <Suspense fallback={<LoadingScreen label={t("loading")} />}>
      <RedirectIfAuthenticated>{children}</RedirectIfAuthenticated>
    </Suspense>
  );
}
