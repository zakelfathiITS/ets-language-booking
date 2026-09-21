import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { LoadingScreen } from "@/components/molecules/LoadingScreen";

import { SessionsScreen } from "./SessionsScreen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("sessions") };
}

export default async function SessionsPage() {
  const t = await getTranslations();

  // The screen reads its filters from the URL (useSearchParams).
  return (
    <Suspense fallback={<LoadingScreen label={t("sessions.loading")} />}>
      <SessionsScreen />
    </Suspense>
  );
}
