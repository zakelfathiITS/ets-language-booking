import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/organisms/PageHeader";

// Placeholder: this screen is delivered with the upcoming frontend tickets.
export default function Page() {
  return (
    <>
      <PageHeader title="My account" description="Manage your name and email address." />
      <EmptyState title="Coming next" description="This screen is part of the next delivery." />
    </>
  );
}
