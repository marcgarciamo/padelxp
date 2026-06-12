"use client";

import { useState, useTransition } from "react";
import { submitTournamentResult } from "@lib/actions/tournaments";
import { toast } from "sonner";
import { type TournamentTeam } from "@db/schema";
import { Button } from "@components/ui/button";

interface Props {
  matchId: string;
  team1:   TournamentTeam;
  team2:   TournamentTeam;
}

export function ReportMatchModal({ matchId, team1, team2 }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sets, setSets] = useState([
    { team1: "", team2: "" },
    { team1: "", team2: "" },
    { team1: "", team2: "" }
  ]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{ 
          marginTop: "10px", 
          width: "calc(100% - 20px)", 
          marginInline: "10px",
          padding: "8px", 
          fontSize: "12px", 
          background: "var(--accent)", 
          color: "#fff", 
          border: "none", 
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
          marginBottom: "10px"
        }}
      >
        Reportar Resultado
      </button>
    );
  }

  async function handleSave() {
    // Filtrar sets vacíos y convertir a números
    const finalSets = sets
      .filter(s => s.team1 !== "" && s.team2 !== "")
      .map(s => ({ team1: parseInt(s.team1), team2: parseInt(s.team2) }));

    if (finalSets.length < 2) {
      return toast.error("Mínimo introduce 2 sets");
    }

    // Determinar ganador automáticamente por sets
    let team1Wins = 0;
    let team2Wins = 0;
    finalSets.forEach(s => {
      if (s.team1 > s.team2) team1Wins++;
      else if (s.team2 > s.team1) team2Wins++;
    });

    if (team1Wins === team2Wins) {
      return toast.error("No puede haber un empate en sets");
    }

    const winnerId = team1Wins > team2Wins ? team1.id : team2.id;

    startTransition(async () => {
      try {
        await submitTournamentResult(matchId, finalSets, winnerId);
        toast.success("Resultado guardado y bracket actualizado");
        setIsOpen(false);
      } catch (e: any) {
        toast.error(e.message || "Error al reportar");
      }
    });
  }

  const updateSet = (index: number, team: 'team1' | 'team2', value: string) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [team]: value } : s));
  };

  return (
    <div style={{ 
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
      background: "rgba(0,0,0,0.85)", zIndex: 100, 
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      backdropFilter: "blur(4px)"
    }}>
      <div className="card" style={{ padding: "24px", width: "100%", maxWidth: "360px", background: "var(--bg-surface)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", textAlign: "center" }}>Resultado del Partido</h3>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", marginBottom: "20px" }}>
          {team1.name} vs {team2.name}
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 40px 40px", gap: "10px", alignItems: "center" }}>
            <div />
            {[1, 2, 3].map(i => (
              <div key={i} style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center", fontWeight: 600 }}>SET {i}</div>
            ))}

            <div style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team1.name}</div>
            {[0, 1, 2].map(i => (
              <input
                key={i}
                type="number"
                value={sets[i].team1}
                onChange={(e) => updateSet(i, 'team1', e.target.value)}
                style={{ width: "40px", height: "40px", textAlign: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff" }}
              />
            ))}

            <div style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team2.name}</div>
            {[0, 1, 2].map(i => (
              <input
                key={i}
                type="number"
                value={sets[i].team2}
                onChange={(e) => updateSet(i, 'team2', e.target.value)}
                style={{ width: "40px", height: "40px", textAlign: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff" }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
          <Button 
            disabled={isPending}
            onClick={handleSave}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            {isPending ? "Guardando..." : "Confirmar Resultado"}
          </Button>
          <button 
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            style={{ width: "100%", padding: "10px", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
