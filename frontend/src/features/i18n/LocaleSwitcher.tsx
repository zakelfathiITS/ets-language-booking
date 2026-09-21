"use client";

import { useLocale } from "next-intl";

import { LanguageSwitcher } from "@/components/organisms/LanguageSwitcher";
import type { Locale } from "@/lib/i18n/locales";

import { useChangeLocale } from "./useChangeLocale";

/** The language switcher, wired to the current locale. */
export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const { changeLocale, isPending } = useChangeLocale();

  return <LanguageSwitcher value={locale} onChange={changeLocale} disabled={isPending} />;
}
