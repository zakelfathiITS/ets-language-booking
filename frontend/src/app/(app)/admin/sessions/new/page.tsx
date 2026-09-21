import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NewSessionScreen } from "./NewSessionScreen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("newSession") };
}

export default function NewSessionPage() {
  return <NewSessionScreen />;
}
