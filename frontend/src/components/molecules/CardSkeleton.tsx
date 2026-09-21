import { Skeleton } from "../atoms/Skeleton";

export function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <Skeleton className="h-5 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
