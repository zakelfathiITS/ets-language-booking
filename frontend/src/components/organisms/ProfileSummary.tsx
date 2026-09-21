import { useTranslations } from "next-intl";

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
    <section aria-labelledby="profile-summary" className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level={2}>
            <span id="profile-summary">{name}</span>
          </Heading>
          <p className="mt-1 text-sm text-neutral-600">{email}</p>
        </div>
        <Badge tone={isAdmin ? "info" : "neutral"}>{isAdmin ? t("administrator") : t("candidate")}</Badge>
      </div>
      <p className="mt-4 text-xs text-neutral-500">{t("memberSince", { date: memberSince })}</p>
    </section>
  );
}
