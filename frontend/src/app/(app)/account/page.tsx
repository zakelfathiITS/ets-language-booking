import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AccountScreen } from "./AccountScreen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("account") };
}

export default function AccountPage() {
  return <AccountScreen />;
}
