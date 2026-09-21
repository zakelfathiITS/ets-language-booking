"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

import { type Locale, LOCALE_COOKIE } from "@/lib/i18n/locales";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Remembers the chosen language and re-renders the current page in it. The
 * refresh is a soft one: the session, the store and cached data are kept.
 */
export function useChangeLocale() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const changeLocale = useCallback(
    (locale: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
      startTransition(() => router.refresh());
    },
    [router],
  );

  return { changeLocale, isPending };
}
