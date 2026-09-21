"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "up" | "down";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Calls the API health endpoint from the browser, which exercises the whole
 * chain at once: CORS, backend and MongoDB.
 */
export function ApiStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/health`, { signal: controller.signal, cache: "no-store" })
      .then((response) => setStatus(response.ok ? "up" : "down"))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("down");
        }
      });

    return () => controller.abort();
  }, []);

  const label = {
    checking: "Checking API…",
    up: "API and database are up",
    down: "API unreachable",
  }[status];

  const color = {
    checking: "bg-amber-400",
    up: "bg-emerald-500",
    down: "bg-red-500",
  }[status];

  return (
    <p role="status" className="inline-flex items-center gap-2 text-sm">
      <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </p>
  );
}
