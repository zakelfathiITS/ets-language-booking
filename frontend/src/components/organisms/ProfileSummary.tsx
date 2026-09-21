import { CalendarDays, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar } from "../atoms/Avatar";
import { Badge } from "../atoms/Badge";
import { Heading } from "../atoms/Heading";

export interface ProfileSummaryProps {
  name: string;
  email: string;
  isAdmin: boolean;
  /** Already formatted in the current language. */
  memberSince: string;
}

export function ProfileSummary({ name, email, isAdmin, memberSince }: ProfileSummaryProps) {
  const t = useTranslations("account");

  return (
    <section aria-labelledby="profile-summary" className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div aria-hidden="true" className="relative h-20 bg-gradient-to-br from-brand-400 via-brand-600 to-brand-900">
        <div className="dot-grid absolute inset-0" />
      </div>
      <div className="px-6 pb-6">
        <div className="-mt-7 flex items-end justify-between gap-4">
          <span className="relative rounded-full ring-4 ring-surface">
            <Avatar name={name} size="lg" />
          </span>
          <Badge tone={isAdmin ? "info" : "neutral"}>{isAdmin ? t("administrator") : t("candidate")}</Badge>
        </div>
        <Heading level={2} className="mt-3">
          <span id="profile-summary">{name}</span>
        </Heading>
        <p className="mt-1 flex items-center gap-2 text-sm break-all text-ink-muted">
          <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-subtle" />
          {email}
        </p>
        <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs text-ink-subtle">
          <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {t("memberSince", { date: memberSince })}
        </p>
      </div>
    </section>
  );
}
