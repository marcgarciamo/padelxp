"use client";

import { useState, useTransition } from "react";
import { voteMvp } from "@lib/actions/mvp";
import { Avatar } from "@components/player/avatar";
import { toast } from "sonner";
import type { Player } from "@db/schema";

interface Props {
  matchId:        string;
  matchType:      "league" | "tournament";
  currentPlayer:  Player;
  rivals:         Player[];
  team1Player1Id: string;
  team1Player2Id: string;
  team2Player1Id: string;
  team2Player2Id: string;
  alreadyVoted:   boolean;
  confirmedMvp?:  Player | null;
  expiresAt:      string;
  totalVotes:     number;
}

export function MvpVotePanel({
  matchId, matchType, rivals,
  team1Player1Id, team1Player2Id,
  team2Player1Id, team2Player2Id,
  alreadyVoted, confirmedMvp, expiresAt, totalVotes,
}: Props) {
  const [selectedId, setSelectedId]  = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [voted, setVoted]            = useState(alreadyVoted);
  const [mvp, setMvp]                = useState(confirmedMvp ?? null);

  const now       = new Date();
  const expDate   = new Date(expiresAt);
  const expired   = now > expDate;
  const hoursLeft = Math.max(0, Math.round((expDate.getTime() - now.getTime()) / 3_600_000));

  function handleVote() {
    if (!selectedId) { toast.error("Selecciona un jugador"); return; }
    startTransition(async () => {
      try {
        const result = await voteMvp({
          matchId, matchType, nomineeId: selectedId,
          team1Player1Id, team1Player2Id,
          team2Player1Id, team2Player2Id,
        });
        setVoted(true);
        if (result.mvpFound && result.mvpId) {
          const mvpPlayer = rivals.find((r) => r.id === result.mvpId);
          if (mvpPlayer) setMvp(mvpPlayer);
          toast.success(`🌟 ¡${mvpPlayer?.displayName ?? "Jugador"} es el MVP! +50 XP`);
        } else {
          toast.success("¡Voto registrado! Esperando el resto de votos...");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al votar");
      }
    });
  }

  if (mvp) {
    return (
      <div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))", border: "1px solid rgba(245,158,11,0.4)", borderRadius: "12px", padding: "14px", textAlign: "center", marginTop: "10px" }}>
        <div style={{ fontSize: "26px", marginBottom: "6px" }}>🌟</div>
        <div style={{ fontSize: "12px", color: "var(--gold)", fontWeight: 600, marginBottom: "8px" }}>MVP del partido</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <Avatar name={mvp.displayName} src={mvp.avatarUrl} size={40} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "14px", fontWeight: 700 }}>{mvp.displayName}</div>
            <div style={{ fontSize: "11px", color: "var(--gold)" }}>+50 XP ganados</div>
          </div>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div style={{ padding: "10px 14px", textAlign: "center", marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
        ⏰ Votación MVP expirada{totalVotes < 2 ? " — sin suficientes votos" : ""}
      </div>
    );
  }

  if (voted) {
    return (
      <div style={{ background: "var(--bg-elevated)", borderRadius: "10px", padding: "12px", marginTop: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "16px" }}>🌟</span>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 500 }}>Voto MVP registrado</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Esperando más votos · {totalVotes}/4</div>
          </div>
        </div>
        <div style={{ height: "3px", background: "var(--bg-primary)", borderRadius: "2px" }}>
          <div style={{ height: "100%", width: `${(totalVotes / 4) * 100}%`, background: "var(--gold)", borderRadius: "2px" }} />
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>⏱ {hoursLeft}h restantes</div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-elevated)", borderRadius: "10px", padding: "12px", marginTop: "10px" }}>
      <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "10px" }}>
        🌟 Vota el MVP · <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>⏱ {hoursLeft}h restantes</span>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        {rivals.map((rival) => (
          <div key={rival.id} onClick={() => setSelectedId(rival.id)} style={{ flex: 1, padding: "10px 6px", borderRadius: "10px", border: selectedId === rival.id ? "2px solid var(--gold)" : "1px solid var(--border)", background: selectedId === rival.id ? "rgba(245,158,11,0.1)" : "var(--bg-primary)", cursor: "pointer", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
              <Avatar name={rival.displayName} src={rival.avatarUrl} size={36} />
            </div>
            <div style={{ fontSize: "11px", fontWeight: 500, color: selectedId === rival.id ? "var(--gold)" : "var(--text-primary)" }}>
              {rival.displayName.split(" ")[0]}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{rival.elo} ELO</div>
            {selectedId === rival.id && <div style={{ fontSize: "12px", marginTop: "2px" }}>⭐</div>}
          </div>
        ))}
      </div>
      <button onClick={handleVote} disabled={isPending || !selectedId} style={{ width: "100%", background: selectedId ? "linear-gradient(135deg, #f59e0b, #d97706)" : "var(--bg-primary)", color: selectedId ? "#fff" : "var(--text-muted)", border: "none", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 600, cursor: selectedId ? "pointer" : "not-allowed" }}>
        {isPending ? "Votando..." : "⭐ Votar MVP"}
      </button>
      <p style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center", marginTop: "6px" }}>
        MVP confirmado cuando 2 rivales votan al mismo jugador
      </p>
    </div>
  );
}
