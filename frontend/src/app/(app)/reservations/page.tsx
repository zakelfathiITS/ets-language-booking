import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/organisms/PageHeader";

// Placeholder: this screen is delivered with the upcoming frontend tickets.
export default function Page() {
  return (
    <>
      <PageHeader title="My reservations" description="Follow and cancel your bookings." />
      <EmptyState title="Coming next" description="This screen is part of the next delivery." />
    </>
  );
}
