"use client";

import { useState, useTransition } from "react";
import { Button } from "@components/ui/button";
import { joinTournament } from "@lib/actions/tournaments";
import { toast } from "sonner";
import { type Player } from "@db/schema";

interface Props {
  tournamentId: string;
  currentPlayer: Player;
}

export function JoinTournamentForm({ tournamentId, currentPlayer }: Props) {
  const [partnerId, setPartnerId] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerId) return toast.error("Selecciona un compañero");

    startTransition(async () => {
      try {
        await joinTournament(tournamentId, partnerId);
        toast.success("¡Inscritos correctamente!");
        setPartnerId("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al unirse");
      }
    });
  }

  return (
    <div className="card" style={{ padding: "18px", marginBottom: "16px", border: "1px solid var(--accent-dim)" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Inscribirse al torneo</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Tu compañero (ID o Username)</label>
          <input
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            placeholder="Escribe el ID o busca un amigo..."
            style={{ 
              background: "var(--bg-elevated)", 
              border: "1px solid var(--border)", 
              borderRadius: "8px", 
              padding: "10px", 
              color: "#fff",
              fontSize: "13px"
            }}
          />
        </div>
        <Button 
          type="submit" 
          disabled={isPending} 
          className="btn-primary"
          style={{ border: "none" }}
        >
          {isPending ? "Inscribiendo..." : "Confirmar pareja"}
        </Button>
      </form>
    </div>
  );
}
