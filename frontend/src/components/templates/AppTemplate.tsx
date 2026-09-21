import type { ReactNode } from "react";

export interface AppTemplateProps {
  header: ReactNode;
  children: ReactNode;
}

/** Layout of every signed-in screen: navigation bar and a centered content area. */
export function AppTemplate({ header, children }: AppTemplateProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-neutral-200 bg-white py-4 text-center text-xs text-neutral-500">
        ETS Language Test Booking
      </footer>
    </div>
  );
}
