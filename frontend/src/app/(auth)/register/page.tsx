import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { RegisterScreen } from "./RegisterScreen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("register") };
}

export default function RegisterPage() {
  return <RegisterScreen />;
}
