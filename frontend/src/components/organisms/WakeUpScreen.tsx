"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "../atoms/Button";
import { Heading } from "../atoms/Heading";
import { Logo } from "../atoms/Logo";
import { Spinner } from "../atoms/Spinner";

/** After this long, waking up is taking longer than a free plan usually needs. */
const SLOW_AFTER_MS = 45_000;

export interface WakeUpScreenProps {
  /** Checks carry on by themselves; this only decides when to offer a reload. */
  slowAfterMs?: number;
  onRetry?: () => void;
}

/** Shown while a sleeping API starts again (free hosting plans pause it when unused). */
export function WakeUpScreen({ slowAfterMs = SLOW_AFTER_MS, onRetry = () => globalThis.location.reload() }: WakeUpScreenProps) {
  const t = useTranslations();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), slowAfterMs);

    return () => clearTimeout(timer);
  }, [slowAfterMs]);

  return (
    <main className="canvas-glow flex min-h-screen flex-1 flex-col items-center justify-center px-4 py-16">
      <div
        role="status"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-raised motion-safe:animate-rise"
      >
        <div className="flex justify-center">
          <Logo brand={t("common.brand")} product={t("common.product")} />
        </div>
        <Spinner size="lg" className="mx-auto mt-8 text-brand-600" />
        <Heading level={1} className="mt-6 text-xl sm:text-2xl">
          {t("availability.title")}
        </Heading>
        <p className="mt-2 text-sm text-ink-muted">{t("availability.description")}</p>
        {isSlow ? (
          <div className="mt-5 border-t border-line pt-5 motion-safe:animate-fade">
            <p className="text-sm text-ink-muted">{t("availability.slow")}</p>
            <Button variant="secondary" className="mt-3" onClick={onRetry}>
              {t("availability.retry")}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-xs text-ink-subtle">{t("availability.hint")}</p>
        )}
      </div>
    </main>
  );
}
