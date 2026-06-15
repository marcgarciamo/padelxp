"use client";

import { useTransition } from "react";
import { startLeague } from "@lib/actions/leagues";
import { toast } from "sonner";

interface Props { leagueId: string; teamCount: number; }

export function StartLeagueButton({ leagueId, teamCount }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    if (!confirm(`¿Iniciar la liga con ${teamCount} equipos? Esto generará el calendario completo y no podrán unirse más equipos.`)) return;
    startTransition(async () => {
      try {
        await startLeague(leagueId);
        toast.success("¡Liga iniciada! El calendario está listo 🏆");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al iniciar la liga");
      }
    });
  }

  return (
    <button
      onClick={handleStart}
      disabled={isPending}
      style={{ width: "100%", background: "var(--green)", color: "#fff", border: "none", borderRadius: "10px", padding: "14px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
    >
      {isPending ? "Iniciando..." : `🚀 Iniciar liga con ${teamCount} equipos`}
    </button>
  );
}
