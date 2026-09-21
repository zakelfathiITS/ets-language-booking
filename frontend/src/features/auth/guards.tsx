"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useSyncExternalStore } from "react";

import { ButtonLink } from "@/components/atoms/ButtonLink";
import { EmptyState } from "@/components/molecules/EmptyState";
import { LoadingScreen } from "@/components/molecules/LoadingScreen";
import { safeRedirectPath } from "@/lib/safeRedirect";

import { useAuth } from "./useAuth";

export const HOME_PATH = "/reservations";
export const LOGIN_PATH = "/login";

const subscribeToNothing = () => () => {};

/**
 * False while server HTML is being hydrated. The session is restored from
 * localStorage right after the first commit, and a page inside a Suspense
 * boundary may hydrate later: until then, guards must render what the server
 * rendered (the loading screen), whatever the status already is.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

/**
 * Renders its children for signed-in users only; others are sent to the login
 * page, which brings them back here afterwards.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, sessionEnd } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const hydrated = useHydrated();

  useEffect(() => {
    if (status !== "anonymous") {
      return;
    }

    // After signing out on purpose, the next person starts from a clean login page.
    router.replace(sessionEnd === "user" ? LOGIN_PATH : `${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`);
  }, [status, sessionEnd, router, pathname]);

  if (!hydrated || status !== "authenticated") {
    return <LoadingScreen label={t("checkingSession")} />;
  }

  return children;
}

/** Must be nested in <RequireAuth>. The API enforces the same rule. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const t = useTranslations("guards");

  if (!isAdmin) {
    return (
      <EmptyState
        title={t("adminOnlyTitle")}
        description={t("adminOnlyDescription")}
        action={<ButtonLink href="/sessions">{t("browseSessions")}</ButtonLink>}
      />
    );
  }

  return children;
}

/**
 * For the login and registration pages: signed-in users go straight to where
 * they were heading (?next=), or to their reservations.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const t = useTranslations("common");
  const hydrated = useHydrated();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(safeRedirectPath(next, HOME_PATH));
    }
  }, [status, router, next]);

  if (!hydrated || status !== "anonymous") {
    return <LoadingScreen label={t("loading")} />;
  }

  return children;
}
