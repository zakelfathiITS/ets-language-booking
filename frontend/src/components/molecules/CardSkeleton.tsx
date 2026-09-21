import { Skeleton } from "../atoms/Skeleton";

export function CardSkeleton() {
  return (
    <div className="space-y-5 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}
