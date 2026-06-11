"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function NotificationRefresher() {
  const router = useRouter();

  useEffect(() => {
    // Refrescamos los datos para que el badge de notificaciones del nav se actualice
    router.refresh();
  }, [router]);

  return null;
}
