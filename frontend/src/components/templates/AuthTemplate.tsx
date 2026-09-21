import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Heading } from "../atoms/Heading";
import { Logo } from "../atoms/Logo";

const FEATURES = ["realTime", "oneClick", "bilingual"] as const;

export interface AuthTemplateProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Top-right slot, e.g. the language switcher. */
  toolbar?: ReactNode;
}

/** Sign-in and sign-up screens: a brand panel on wide screens, the form card next to it. */
export function AuthTemplate({ title, subtitle, children, footer, toolbar }: AuthTemplateProps) {
  const t = useTranslations();

  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div aria-hidden="true" className="dot-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div aria-hidden="true" className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-300/25 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

        <Logo brand={t("common.brand")} product={t("common.product")} inverted className="relative" />

        <div className="relative max-w-md motion-safe:animate-rise">
          <p className="text-3xl leading-tight font-semibold tracking-tight text-balance xl:text-4xl">{t("auth.hero.title")}</p>
          <p className="mt-4 text-base text-brand-100">{t("auth.hero.subtitle")}</p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm font-medium text-white">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                  <Check aria-hidden="true" className="h-4 w-4" />
                </span>
                {t(`auth.hero.features.${feature}`)}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-brand-200">{t("common.footer")}</p>
      </aside>

      <main className="canvas-glow relative flex flex-col items-center justify-center px-4 py-20 sm:px-8">
        {toolbar && <div className="absolute right-4 top-4 sm:right-6 sm:top-6">{toolbar}</div>}
        <div className="w-full max-w-md motion-safe:animate-rise">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo brand={t("common.brand")} product={t("common.product")} />
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-raised sm:p-8">
            <Heading level={1}>{title}</Heading>
            {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
