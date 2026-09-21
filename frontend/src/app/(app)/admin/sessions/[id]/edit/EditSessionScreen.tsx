"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

import { ButtonLink } from "@/components/atoms/ButtonLink";
import { EmptyState } from "@/components/molecules/EmptyState";
import { LoadingScreen } from "@/components/molecules/LoadingScreen";
import { PageHeader } from "@/components/organisms/PageHeader";
import { SessionForm } from "@/components/organisms/SessionForm";
import { useGetSessionQuery, useUpdateSessionMutation } from "@/features/admin/adminSessionsApi";
import { useFlash } from "@/features/flash/useFlash";
import { toServerFormErrors } from "@/features/forms/toServerFormErrors";
import { formatSessionDate } from "@/lib/format";
import type { SessionValues } from "@/lib/validation/sessionSchema";

export function EditSessionScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { show } = useFlash();
  const { data: session, isLoading, isError } = useGetSessionQuery(id);
  const [updateSession, update] = useUpdateSessionMutation();
  const serverErrors = useMemo(() => (update.error ? toServerFormErrors(update.error) : null), [update.error]);

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
      const updated = result.data;
      show({ tone: "success", message: `Session updated: ${updated.language}, ${formatSessionDate(updated.date)} at ${updated.time}.` });
      router.push("/admin/sessions");
    }
  }

  if (isLoading) {
    return <LoadingScreen label="Loading the session…" />;
  }

  if (isError || !session || !initialValues) {
    return (
      <EmptyState
        title="Session not found"
        description="It may have been deleted in the meantime."
        action={<ButtonLink href="/admin/sessions">Back to the sessions</ButtonLink>}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Edit session"
        description={`${session.seatsTaken} of ${session.capacity} seats are booked: the capacity cannot go below the seats already booked.`}
      />
      <div className="max-w-2xl rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <SessionForm
          initialValues={initialValues}
          submitLabel="Save changes"
          cancelHref="/admin/sessions"
          timezone={session.timezone}
          onSubmit={onSubmit}
          isSubmitting={update.isLoading}
          serverErrors={serverErrors}
        />
      </div>
    </>
  );
}
