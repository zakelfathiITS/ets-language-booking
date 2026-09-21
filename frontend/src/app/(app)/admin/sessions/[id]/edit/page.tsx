import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EditSessionScreen } from "./EditSessionScreen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("editSession") };
}

export default function EditSessionPage() {
  return <EditSessionScreen />;
}
