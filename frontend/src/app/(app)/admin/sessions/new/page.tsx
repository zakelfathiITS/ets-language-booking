import type { Metadata } from "next";

import { NewSessionScreen } from "./NewSessionScreen";

export const metadata: Metadata = { title: "New session" };

export default function NewSessionPage() {
  return <NewSessionScreen />;
}
