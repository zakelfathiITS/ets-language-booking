import { ButtonLink } from "@/components/atoms/ButtonLink";
import { EmptyState } from "@/components/molecules/EmptyState";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist or has moved."
        action={<ButtonLink href="/">Go to the home page</ButtonLink>}
      />
    </main>
  );
}
