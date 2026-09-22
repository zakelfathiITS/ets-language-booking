import { useTranslations } from "next-intl";

import { Heading } from "../atoms/Heading";
import { Logo } from "../atoms/Logo";
import { Spinner } from "../atoms/Spinner";

/** Shown while a sleeping API starts again (free hosting plans pause it when unused). */
export function WakeUpScreen() {
  const t = useTranslations();

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
        <p className="mt-4 text-xs text-ink-subtle">{t("availability.hint")}</p>
      </div>
    </main>
  );
}
