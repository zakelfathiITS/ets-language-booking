import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/organisms/PageHeader";

// Placeholder: the back-office is delivered with ETS-09.
export default function AdminSessionsPage() {
  return (
    <>
      <PageHeader title="Manage sessions" description="Create, edit and delete test sessions." />
      <EmptyState title="Coming next" description="This screen is part of the next delivery." />
    </>
  );
}
