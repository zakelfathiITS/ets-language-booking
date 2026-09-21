import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export interface SeatIndicatorProps {
  seatsAvailable: number;
  capacity: number;
}

export function SeatIndicator({ seatsAvailable, capacity }: SeatIndicatorProps) {
  const t = useTranslations("sessions.seats");
  const taken = capacity - seatsAvailable;
  const ratio = capacity > 0 ? taken / capacity : 1;

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <Users aria-hidden="true" className="h-4 w-4 text-ink-subtle" />
        {t("left", { available: seatsAvailable, capacity })}
      </p>
      <div
        role="progressbar"
        aria-label={t("progress")}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={taken}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-[width] duration-500",
            ratio >= 1 ? "from-red-400 to-red-600" : ratio >= 0.75 ? "from-amber-300 to-amber-500" : "from-emerald-300 to-emerald-500",
          )}
          style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
        />
      </div>
    </div>
  );
}
