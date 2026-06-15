"use client";

import { useState, useTransition } from "react";
import { joinLeague } from "@lib/actions/leagues";
import { Avatar } from "@components/player/avatar";
import { toast } from "sonner";
import type { Player } from "@db/schema";

interface Props { leagueId: string; friends: Player[]; currentPlayer: Player; }

export function JoinLeagueForm({ leagueId, friends }: Props) {
  const [selectedId, setSelectedId]  = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function handleJoin() {
    if (!selectedId) { toast.error("Selecciona un compañero"); return; }
    startTransition(async () => {
      try {
        await joinLeague(leagueId, selectedId);
        toast.success("¡Os habéis inscrito en la liga!");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al inscribirse");
      }
    });
  }

  if (friends.length === 0) {
    return (
      <div className="card" style={{ padding: "16px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px" }}>
          Necesitas amigos en tu crew para unirte a la liga.
        </p>
        <a href="/crew" style={{ color: "var(--accent-light)", fontSize: "12px" }}>Buscar jugadores →</a>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "16px" }}>
      <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px" }}>Unirse a la liga</div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>Elige compañero de tu crew</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
        {friends.map((f) => (
          <div key={f.id} onClick={() => setSelectedId(f.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: selectedId === f.id ? "1px solid var(--accent)" : "1px solid var(--border)", background: selectedId === f.id ? "rgba(124,92,252,0.1)" : "var(--bg-elevated)", cursor: "pointer" }}>
            <Avatar name={f.displayName} src={f.avatarUrl} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 500 }}>{f.displayName}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{f.elo} ELO</div>
            </div>
            {selectedId === f.id && <span style={{ color: "var(--accent-light)" }}>✓</span>}
          </div>
        ))}
      </div>
      <button onClick={handleJoin} disabled={isPending || !selectedId} style={{ width: "100%", background: selectedId ? "var(--accent)" : "var(--bg-elevated)", color: selectedId ? "#fff" : "var(--text-muted)", border: "none", borderRadius: "10px", padding: "12px", fontSize: "13px", fontWeight: 500, cursor: selectedId ? "pointer" : "not-allowed" }}>
        {isPending ? "Inscribiendo..." : "Inscribirse en la liga"}
      </button>
    </div>
  );
}
