import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ReservationsScreen } from "./ReservationsScreen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("reservations") };
}

export default function ReservationsPage() {
  return <ReservationsScreen />;
}
