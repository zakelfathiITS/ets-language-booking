"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import { LOCALES, type Locale } from "@/lib/i18n/locales";

export interface LanguageSwitcherProps {
  value: Locale;
  onChange: (locale: Locale) => void;
  disabled?: boolean;
}

/** Each language is written in itself ("English", "Français"), as users look for their own. */
export function LanguageSwitcher({ value, onChange, disabled = false }: LanguageSwitcherProps) {
  const t = useTranslations("language");
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        {t("label")}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as Locale)}
        className="rounded-md border border-neutral-300 bg-white py-1.5 pl-2 pr-7 text-sm text-neutral-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale} lang={locale}>
            {t(locale)}
          </option>
        ))}
      </select>
    </div>
  );
}
