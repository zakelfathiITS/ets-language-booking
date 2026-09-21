"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Card } from "@/components/atoms/Card";
import { PageHeader } from "@/components/organisms/PageHeader";
import { SessionForm } from "@/components/organisms/SessionForm";
import { useCreateSessionMutation } from "@/features/admin/adminSessionsApi";
import { useFlash } from "@/features/flash/useFlash";
import { useApiErrors } from "@/features/i18n/useApiErrors";
import { useListSessionsQuery } from "@/features/sessions/sessionsApi";
import { useSessionLabel } from "@/features/sessions/useSessionLabel";
import { DEFAULT_TIMEZONE } from "@/lib/env";
import type { SessionValues } from "@/lib/validation/sessionSchema";

export function NewSessionScreen() {
  const t = useTranslations("admin");
  const router = useRouter();
  const describe = useSessionLabel();
  const { show } = useFlash();
  const { formErrorsOf } = useApiErrors();
  const [createSession, { isLoading, error }] = useCreateSessionMutation();
  // Any session tells the timezone in which the API reads dates and times.
  const { data: sample } = useListSessionsQuery({ page: 1, limit: 1, includePast: true });
  const serverErrors = useMemo(() => (error ? formErrorsOf(error) : null), [error, formErrorsOf]);

  async function onSubmit(values: SessionValues) {
    const result = await createSession(values);
    if (result.data) {
      show({ tone: "success", message: t("created", { session: describe(result.data) }) });
      router.push("/admin/sessions");
    }
  }

  return (
    <>
      <PageHeader title={t("form.newTitle")} description={t("form.newDescription")} />
      <Card className="max-w-2xl motion-safe:animate-rise">
        <SessionForm
          submitLabel={t("form.create")}
          cancelHref="/admin/sessions"
          timezone={sample?.items[0]?.timezone ?? DEFAULT_TIMEZONE}
          onSubmit={onSubmit}
          isSubmitting={isLoading}
          serverErrors={serverErrors}
        />
      </Card>
    </>
  );
}
