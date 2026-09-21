import { ApiStatus } from "./api-status";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        ETS Language Test Booking
      </h1>
      <p className="text-base text-neutral-600 dark:text-neutral-400">
        Book, follow and cancel your language test sessions.
      </p>
      <ApiStatus />
    </main>
  );
}
