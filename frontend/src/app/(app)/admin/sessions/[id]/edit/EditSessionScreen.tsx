"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Card } from "@/components/atoms/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
import { LoadingScreen } from "@/components/molecules/LoadingScreen";
import { PageHeader } from "@/components/organisms/PageHeader";
import { SessionForm } from "@/components/organisms/SessionForm";
import { useGetSessionQuery, useUpdateSessionMutation } from "@/features/admin/adminSessionsApi";
import { useFlash } from "@/features/flash/useFlash";
import { useApiErrors } from "@/features/i18n/useApiErrors";
import { useSessionLabel } from "@/features/sessions/useSessionLabel";
import type { SessionValues } from "@/lib/validation/sessionSchema";

export function EditSessionScreen() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const describe = useSessionLabel();
  const { show } = useFlash();
  const { formErrorsOf } = useApiErrors();
  const { data: session, isLoading, isError } = useGetSessionQuery(id);
  const [updateSession, update] = useUpdateSessionMutation();
  const serverErrors = useMemo(() => (update.error ? formErrorsOf(update.error) : null), [update.error, formErrorsOf]);

  const initialValues = useMemo<SessionValues | undefined>(
    () =>
      session && {
        language: session.language,
        date: session.date,
        time: session.time,
        location: session.location,
        capacity: session.capacity,
      },
    [session],
  );

  async function onSubmit(values: SessionValues) {
    const result = await updateSession({ id, ...values });
    if (result.data) {
      show({ tone: "success", message: t("admin.updated", { session: describe(result.data) }) });
      router.push("/admin/sessions");
    }
  }

  if (isLoading) {
    return <LoadingScreen label={t("admin.form.loading")} />;
  }

  if (isError || !session || !initialValues) {
    return (
      <EmptyState
        title={t("admin.form.notFoundTitle")}
        description={t("admin.form.notFoundDescription")}
        action={<ButtonLink href="/admin/sessions">{t("admin.form.backToList")}</ButtonLink>}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={t("admin.form.editTitle")}
        description={t("admin.form.editDescription", { taken: session.seatsTaken, capacity: session.capacity })}
      />
      <Card className="max-w-2xl motion-safe:animate-rise">
        <SessionForm
          initialValues={initialValues}
          submitLabel={t("common.saveChanges")}
          cancelHref="/admin/sessions"
          timezone={session.timezone}
          onSubmit={onSubmit}
          isSubmitting={update.isLoading}
          serverErrors={serverErrors}
        />
      </Card>
    </>
  );
}
