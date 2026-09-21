"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface SessionFilters {
  page: number;
  language: string | null;
  availableOnly: boolean;
}

function parsePage(value: string | null): number {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * Keeps page and filters in the URL: views can be bookmarked, shared and
 * survive a reload, and the browser's back button works as expected.
 */
export function useSessionFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo<SessionFilters>(
    () => ({
      page: parsePage(searchParams.get("page")),
      language: searchParams.get("language") || null,
      availableOnly: searchParams.get("availableOnly") === "true",
    }),
    [searchParams],
  );

  const update = useCallback(
    (next: SessionFilters) => {
      const params = new URLSearchParams();
      if (next.page > 1) params.set("page", String(next.page));
      if (next.language) params.set("language", next.language);
      if (next.availableOnly) params.set("availableOnly", "true");

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const setPage = useCallback((page: number) => update({ ...filters, page }), [filters, update]);

  /** Changing a filter always goes back to the first page. */
  const setFilters = useCallback(
    (patch: Partial<Omit<SessionFilters, "page">>) => update({ ...filters, ...patch, page: 1 }),
    [filters, update],
  );

  return { filters, setPage, setFilters };
}
