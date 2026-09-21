"use client";

import { ChevronDown, Globe } from "lucide-react";
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
    <div className="relative flex items-center">
      <label htmlFor={id} className="sr-only">
        {t("label")}
      </label>
      <Globe aria-hidden="true" className="pointer-events-none absolute left-2.5 h-4 w-4 text-ink-subtle" />
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as Locale)}
        className="h-9 cursor-pointer appearance-none rounded-full border border-line bg-surface pl-8 pr-8 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-muted focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-wait disabled:opacity-60"
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale} lang={locale}>
            {t(locale)}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-ink-subtle" />
    </div>
  );
}
