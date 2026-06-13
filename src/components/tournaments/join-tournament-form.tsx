"use client";

import { useState, useTransition } from "react";
import { joinTournament } from "@lib/actions/tournaments";
import { toast } from "sonner";
import { Avatar } from "@components/player/avatar";
import type { Player } from "@db/schema";

interface Props {
  tournamentId:   string;
  currentPlayer:  Player;
  friends:        Player[];
}

export function JoinTournamentForm({ tournamentId, currentPlayer, friends }: Props) {
  const [selectedId, setSelectedId]   = useState<string>("");
  const [isPending, startTransition]  = useTransition();

  function handleJoin() {
    if (!selectedId) {
      toast.error("Selecciona un compañero de tu crew");
      return;
    }
    startTransition(async () => {
      try {
        const result = await joinTournament(tournamentId, selectedId);
        toast.success(`Invitación enviada a ${result.partnerName}. Esperando confirmación...`);
        setSelectedId("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al unirse al torneo");
      }
    });
  }

  if (friends.length === 0) {
    return (
      <div className="card" style={{ padding: "16px", marginBottom: "16px", textAlign: "center" }}>
        <div style={{ fontSize: "24px", marginBottom: "8px" }}>👥</div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Necesitas amigos en tu crew para apuntarte a torneos.
        </div>
        <a
          href="/crew"
          style={{
            display:      "inline-block",
            marginTop:    "10px",
            color:        "var(--accent-light)",
            fontSize:     "12px",
            textDecoration: "none",
          }}
        >
          Buscar jugadores →
        </a>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "16px", marginBottom: "16px" }}>
      <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px" }}>
        Inscribirse al torneo
      </div>

      {/* Jugador actual */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <Avatar name={currentPlayer.displayName} avatarUrl={currentPlayer.avatarUrl} size={32} />
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500 }}>{currentPlayer.displayName}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Tú</div>
        </div>
      </div>

      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Elige compañero de tu crew
      </div>

      {/* Lista de amigos seleccionable */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        {friends.map((friend) => (
          <div
            key={friend.id}
            onClick={() => setSelectedId(friend.id)}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "10px",
              padding:      "10px 12px",
              borderRadius: "10px",
              border:       selectedId === friend.id
                ? "1px solid var(--accent)"
                : "1px solid var(--border)",
              background:   selectedId === friend.id
                ? "rgba(124,92,252,0.1)"
                : "var(--bg-elevated)",
              cursor:       "pointer",
              transition:   "all 0.15s",
            }}
          >
            <Avatar name={friend.displayName} avatarUrl={friend.avatarUrl} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 500 }}>{friend.displayName}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{friend.elo} ELO · LV {friend.level}</div>
            </div>
            {selectedId === friend.id && (
              <div style={{ color: "var(--accent-light)", fontSize: "16px" }}>✓</div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleJoin}
        disabled={isPending || !selectedId}
        style={{
          width:        "100%",
          background:   selectedId ? "var(--accent)" : "var(--bg-elevated)",
          color:        selectedId ? "#fff" : "var(--text-muted)",
          border:       "none",
          borderRadius: "10px",
          padding:      "12px",
          fontSize:     "13px",
          fontWeight:   500,
          cursor:       selectedId ? "pointer" : "not-allowed",
          transition:   "all 0.15s",
        }}
      >
        {isPending ? "Enviando invitación..." : "Enviar invitación al compañero"}
      </button>

      <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "8px" }}>
        Tu compañero recibirá una notificación para confirmar
      </p>
    </div>
  );
}
