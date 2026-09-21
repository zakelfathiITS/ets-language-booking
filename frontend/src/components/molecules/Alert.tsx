import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const tones = {
  info: {
    box: "border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-100",
    icon: Info,
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
    icon: CircleCheck,
  },
  error: {
    box: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
    icon: CircleAlert,
  },
} as const;

export interface AlertProps {
  tone?: keyof typeof tones;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
}

/** Errors are announced immediately (role="alert"), other messages politely. */
export function Alert({ tone = "info", title, children, onDismiss }: AlertProps) {
  const t = useTranslations("common");
  const { box, icon: Icon } = tones[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm motion-safe:animate-rise", box)}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        <div className={cn(title && "mt-1")}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("dismiss")}
          className="-m-1 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-current"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
