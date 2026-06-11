"use client";

import { useState, useTransition } from "react";
import { submitTournamentResult } from "@lib/actions/tournaments";
import { toast } from "sonner";
import { type TournamentTeam } from "@db/schema";

interface Props {
  matchId: string;
  team1:   TournamentTeam;
  team2:   TournamentTeam;
}

export function ReportMatchModal({ matchId, team1, team2 }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{ 
          marginTop: "8px", 
          width: "100%", 
          padding: "4px", 
          fontSize: "11px", 
          background: "var(--accent-dim)", 
          color: "var(--accent-light)", 
          border: "none", 
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Reportar Resultado
      </button>
    );
  }

  function handleWinner(winnerId: string) {
    startTransition(async () => {
      try {
        await submitTournamentResult(matchId, [], winnerId);
        toast.success("Resultado guardado y bracket actualizado");
        setIsOpen(false);
      } catch (e: any) {
        toast.error(e.message || "Error al reportar");
      }
    });
  }

  return (
    <div style={{ 
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
      background: "rgba(0,0,0,0.8)", zIndex: 100, 
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" 
    }}>
      <div className="card" style={{ padding: "20px", width: "100%", maxWidth: "340px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 500, marginBottom: "16px", textAlign: "center" }}>¿Quién ganó el partido?</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button 
            disabled={isPending}
            onClick={() => handleWinner(team1.id)}
            style={{ padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer" }}
          >
            Ganador: {team1.name}
          </button>
          <button 
            disabled={isPending}
            onClick={() => handleWinner(team2.id)}
            style={{ padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer" }}
          >
            Ganador: {team2.name}
          </button>
        </div>

        <button 
          onClick={() => setIsOpen(false)}
          disabled={isPending}
          style={{ marginTop: "20px", width: "100%", padding: "10px", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
