"use client";

import { useTransition } from "react";
import { leaveLeague } from "@lib/actions/leagues";
import { toast } from "sonner";

export function LeaveLeagueButton({ leagueId }: { leagueId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleLeave() {
    if (!confirm("¿Seguro que quieres salir de la liga? Tu plaza quedará libre.")) return;
    startTransition(async () => {
      try {
        await leaveLeague(leagueId);
        toast.success("Has salido de la liga");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al salir");
      }
    });
  }

  return (
    <button
      onClick={handleLeave}
      disabled={isPending}
      style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "10px", padding: "10px 16px", fontSize: "13px", color: "#ef4444", cursor: "pointer" }}
    >
      {isPending ? "Saliendo..." : "Salir de la liga"}
    </button>
  );
}
