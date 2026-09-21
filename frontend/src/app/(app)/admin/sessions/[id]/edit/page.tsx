import type { Metadata } from "next";

import { EditSessionScreen } from "./EditSessionScreen";

export const metadata: Metadata = { title: "Edit session" };

export default function EditSessionPage() {
  return <EditSessionScreen />;
}
