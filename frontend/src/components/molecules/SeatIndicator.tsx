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
    <div>
      <p className="text-sm text-neutral-700">{t("left", { available: seatsAvailable, capacity })}</p>
      <div
        role="progressbar"
        aria-label={t("progress")}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={taken}
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100"
      >
        <div
          className={cn("h-full rounded-full", ratio >= 1 ? "bg-red-500" : ratio >= 0.75 ? "bg-amber-500" : "bg-emerald-500")}
          style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
        />
      </div>
    </div>
  );
}
