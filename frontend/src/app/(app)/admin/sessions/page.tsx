import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { LoadingScreen } from "@/components/molecules/LoadingScreen";

import { AdminSessionsScreen } from "./AdminSessionsScreen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("adminSessions") };
}

export default async function AdminSessionsPage() {
  const t = await getTranslations();

  // The screen reads its filters from the URL (useSearchParams).
  return (
    <Suspense fallback={<LoadingScreen label={t("admin.loading")} />}>
      <AdminSessionsScreen />
    </Suspense>
  );
}
