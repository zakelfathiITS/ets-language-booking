"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { PageHeader } from "@/components/organisms/PageHeader";
import { SessionForm } from "@/components/organisms/SessionForm";
import { useCreateSessionMutation } from "@/features/admin/adminSessionsApi";
import { useFlash } from "@/features/flash/useFlash";
import { toServerFormErrors } from "@/features/forms/toServerFormErrors";
import { useListSessionsQuery } from "@/features/sessions/sessionsApi";
import { DEFAULT_TIMEZONE } from "@/lib/env";
import { formatSessionDate } from "@/lib/format";
import type { SessionValues } from "@/lib/validation/sessionSchema";

export function NewSessionScreen() {
  const router = useRouter();
  const { show } = useFlash();
  const [createSession, { isLoading, error }] = useCreateSessionMutation();
  // Any session tells the timezone in which the API reads dates and times.
  const { data: sample } = useListSessionsQuery({ page: 1, limit: 1, includePast: true });
  const serverErrors = useMemo(() => (error ? toServerFormErrors(error) : null), [error]);

  async function onSubmit(values: SessionValues) {
    const result = await createSession(values);
    if (result.data) {
      const session = result.data;
      show({ tone: "success", message: `Session created: ${session.language}, ${formatSessionDate(session.date)} at ${session.time}.` });
      router.push("/admin/sessions");
    }
  }

  return (
    <>
      <PageHeader title="New session" description="Publish a new language test session." />
      <div className="max-w-2xl rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <SessionForm
          submitLabel="Create session"
          cancelHref="/admin/sessions"
          timezone={sample?.items[0]?.timezone ?? DEFAULT_TIMEZONE}
          onSubmit={onSubmit}
          isSubmitting={isLoading}
          serverErrors={serverErrors}
        />
      </div>
    </>
  );
}
