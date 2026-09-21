import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Heading } from "../atoms/Heading";

export interface AuthTemplateProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Top-right slot, e.g. the language switcher. */
  toolbar?: ReactNode;
}

/** Centered card used by the sign-in and sign-up screens. */
export function AuthTemplate({ title, subtitle, children, footer, toolbar }: AuthTemplateProps) {
  const t = useTranslations("common");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {toolbar && <div className="absolute right-4 top-4">{toolbar}</div>}
      <p className="mb-6 text-lg font-semibold text-brand-700">
        {t("brand")} <span className="text-neutral-900">{t("product")}</span>
      </p>
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <Heading level={1} className="text-center sm:text-2xl">
          {title}
        </Heading>
        {subtitle && <p className="mt-2 text-center text-sm text-neutral-600">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-neutral-600">{footer}</div>}
    </main>
  );
}
