"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 30_000;

export function AutoRefresh() {
  const router = useRouter();

  const refresh = useCallback(() => {
    if (document.visibilityState === "visible") {
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    const id = setInterval(refresh, INTERVAL_MS);

    // Refresh instantly when the user returns to the tab
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [refresh]);

  return null;
}
