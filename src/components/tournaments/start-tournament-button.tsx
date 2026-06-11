"use client";

import { useTransition } from "react";
import { Button } from "@components/ui/button";
import { startTournament } from "@lib/actions/tournaments";
import { toast } from "sonner";

interface Props {
  tournamentId: string;
}

export function StartTournamentButton({ tournamentId }: Props) {
  const [isPending, startTransition] = useTransition();

  async function handleStart() {
    startTransition(async () => {
      try {
        await startTournament(tournamentId);
        toast.success("¡Torneo iniciado! Bracket generado.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al iniciar");
      }
    });
  }

  return (
    <div style={{ marginTop: "24px", textAlign: "center" }}>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
        Como creador, puedes iniciar el torneo cuando haya suficientes equipos.
      </p>
      <Button
        onClick={handleStart}
        disabled={isPending}
        className="btn-primary"
        style={{ width: "100%", background: "var(--green)", border: "none" }}
      >
        {isPending ? "Generando Bracket..." : "🚀 Iniciar Torneo"}
      </Button>
    </div>
  );
}
