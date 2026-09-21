import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export interface AppTemplateProps {
  header: ReactNode;
  children: ReactNode;
}

/** Layout of every signed-in screen: navigation bar and a centered content area. */
export function AppTemplate({ header, children }: AppTemplateProps) {
  const t = useTranslations("common");

  return (
    <div className="canvas-glow flex min-h-screen flex-col">
      {header}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t border-line py-6 text-center text-xs text-ink-subtle">{t("footer")}</footer>
    </div>
  );
}
