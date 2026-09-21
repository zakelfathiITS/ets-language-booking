import { Spinner } from "../atoms/Spinner";

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-3 text-ink-muted motion-safe:animate-fade">
      <Spinner size="lg" className="text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
