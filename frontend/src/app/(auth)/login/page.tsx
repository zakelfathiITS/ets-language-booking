import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LoginScreen } from "./LoginScreen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("signIn") };
}

export default function LoginPage() {
  return <LoginScreen />;
}
