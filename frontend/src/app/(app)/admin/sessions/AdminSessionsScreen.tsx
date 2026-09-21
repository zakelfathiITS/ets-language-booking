"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Alert } from "@/components/molecules/Alert";
import { CardSkeleton } from "@/components/molecules/CardSkeleton";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PaginationControls } from "@/components/molecules/PaginationControls";
import { ConfirmDialog } from "@/components/organisms/ConfirmDialog";
import { PageHeader } from "@/components/organisms/PageHeader";
import { SessionsTable } from "@/components/organisms/SessionsTable";
import { useDeleteSessionMutation } from "@/features/admin/adminSessionsApi";
import type { Flash } from "@/features/flash/flashSlice";
import { useFlash } from "@/features/flash/useFlash";
import { bookingErrorMessage } from "@/features/reservations/bookingMessages";
import { useListSessionsQuery } from "@/features/sessions/sessionsApi";
import { useSessionFilters } from "@/features/sessions/useSessionFilters";
import { formatSessionDate } from "@/lib/format";
import type { TestSession } from "@/types/api";

const PAGE_SIZE = 20;

function describe(session: TestSession): string {
  return `${session.language}, ${formatSessionDate(session.date)} at ${session.time}`;
}

export function AdminSessionsScreen() {
  const { filters, setPage, setFilters } = useSessionFilters();
  const sessions = useListSessionsQuery({ page: filters.page, limit: PAGE_SIZE, includePast: filters.includePast });
  const [deleteSession, deletion] = useDeleteSessionMutation();
  const { flash, clear: clearFlash } = useFlash();

  const [localNotice, setLocalNotice] = useState<Flash | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<TestSession | null>(null);

  // A message left by the create/edit screens before redirecting here stays
  // until dismissed, replaced, or until the admin leaves the page.
  const notice = localNotice ?? flash;
  useEffect(() => clearFlash, [clearFlash]);

  function showNotice(next: Flash | null) {
    clearFlash();
    setLocalNotice(next);
  }

  async function confirmDeletion() {
    const session = sessionToDelete;
    if (!session) {
      return;
    }

    const result = await deleteSession(session.id);
    setSessionToDelete(null);
    showNotice(
      result.error
        ? { tone: "error", message: bookingErrorMessage(result.error) }
        : { tone: "success", message: `Session deleted: ${describe(session)}.` },
    );
  }

  const data = sessions.data;

  return (
    <>
      <PageHeader
        title="Manage sessions"
        description="Create, edit and delete the test sessions offered to candidates."
        actions={<ButtonLink href="/admin/sessions/new">New session</ButtonLink>}
      />

      <div className="space-y-6">
        <Checkbox
          label="Include past sessions"
          checked={filters.includePast}
          onChange={(event) => setFilters({ includePast: event.target.checked })}
        />

        {notice && (
          <Alert tone={notice.tone} onDismiss={() => showNotice(null)}>
            {notice.message}
          </Alert>
        )}

        {sessions.isLoading ? (
          <>
            <p role="status" className="sr-only">
              Loading sessions…
            </p>
            <CardSkeleton />
          </>
        ) : sessions.isError || !data ? (
          <Alert tone="error" title="The sessions could not be loaded.">
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => void sessions.refetch()}>
              Try again
            </Button>
          </Alert>
        ) : data.items.length === 0 ? (
          <EmptyState
            title="No session yet"
            description="Create the first session of the catalogue."
            action={<ButtonLink href="/admin/sessions/new">New session</ButtonLink>}
          />
        ) : (
          <>
            <SessionsTable
              sessions={data.items}
              editHref={(session) => `/admin/sessions/${session.id}/edit`}
              onDelete={setSessionToDelete}
              deletingId={deletion.isLoading ? sessionToDelete?.id : null}
            />
            <PaginationControls
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
              disabled={sessions.isFetching}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={sessionToDelete !== null}
        title="Delete this session?"
        description={sessionToDelete && `${describe(sessionToDelete)} will be removed from the catalogue.`}
        confirmLabel="Delete session"
        isConfirming={deletion.isLoading}
        onConfirm={() => void confirmDeletion()}
        onCancel={() => setSessionToDelete(null)}
      />
    </>
  );
}
