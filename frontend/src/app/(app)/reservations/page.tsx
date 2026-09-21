import type { Metadata } from "next";

import { ReservationsScreen } from "./ReservationsScreen";

export const metadata: Metadata = { title: "My reservations" };

export default function ReservationsPage() {
  return <ReservationsScreen />;
}
