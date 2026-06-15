"use client";

import { useState, useTransition } from "react";
import { submitLeagueResult } from "@lib/actions/leagues";
import { toast } from "sonner";

interface Props {
  matchId:   string;
  team1Id:   string;
  team2Id:   string;
  team1Name: string;
  team2Name: string;
}

export function SubmitResultForm({ matchId, team1Id, team2Id, team1Name, team2Name }: Props) {
  const [open, setOpen]             = useState(false);
  const [winnerId, setWinnerId]     = useState<string>("");
  const [sets, setSets]             = useState([{ team1: 6, team2: 4 }]);
  const [isPending, startTransition] = useTransition();

  function addSet() {
    if (sets.length < 3) setSets([...sets, { team1: 6, team2: 4 }]);
  }

  function updateSet(i: number, side: "team1" | "team2", val: number) {
    const updated = [...sets];
    updated[i] = { ...updated[i]!, [side]: val };
    setSets(updated);
  }

  function handleSubmit() {
    if (!winnerId) { toast.error("Selecciona el equipo ganador"); return; }
    startTransition(async () => {
      try {
        await submitLeagueResult({ matchId, sets, winnerId });
        toast.success("Resultado guardado ✓");
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ width: "100%", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px", fontSize: "12px", cursor: "pointer", marginTop: "6px" }}
      >
        Introducir resultado
      </button>
    );
  }

  return (
    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", gap: "6px" }}>
        {[{ id: team1Id, name: team1Name }, { id: team2Id, name: team2Name }].map((team) => (
          <div
            key={team.id}
            onClick={() => setWinnerId(team.id)}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: winnerId === team.id ? "2px solid var(--green)" : "1px solid var(--border)", background: winnerId === team.id ? "rgba(34,197,94,0.1)" : "var(--bg-primary)", cursor: "pointer", textAlign: "center", fontSize: "11px", fontWeight: 500, color: winnerId === team.id ? "var(--green)" : "var(--text-muted)" }}
          >
            {team.name}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {sets.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", width: "40px" }}>Set {i + 1}</span>
            <input type="number" min="0" max="7" value={s.team1} onChange={(e) => updateSet(i, "team1", +e.target.value)}
              style={{ width: "48px", textAlign: "center", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px", color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }} />
            <span style={{ color: "var(--text-muted)" }}>—</span>
            <input type="number" min="0" max="7" value={s.team2} onChange={(e) => updateSet(i, "team2", +e.target.value)}
              style={{ width: "48px", textAlign: "center", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px", color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }} />
            {i > 0 && <button onClick={() => setSets(sets.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: "16px" }}>×</button>}
          </div>
        ))}
        {sets.length < 3 && (
          <button onClick={addSet} style={{ background: "none", border: "none", color: "var(--accent-light)", fontSize: "12px", cursor: "pointer", textAlign: "left", padding: "2px 0" }}>
            + Añadir set
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={() => setOpen(false)} style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={isPending} style={{ flex: 2, background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
          {isPending ? "Guardando..." : "Guardar resultado"}
        </button>
      </div>
    </div>
  );
}
