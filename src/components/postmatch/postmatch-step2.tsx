"use client";

import { useState, useTransition } from "react";
import { submitMvpVote } from "@lib/actions/postmatch";
import { Avatar } from "@components/player/avatar";
import { toast } from "sonner";

interface Props {
  flow:          any;
  currentPlayer: any;
  rivals:        any[];
  partner:       any;
  onNext:        () => void;
}

export function PostmatchStep2({ flow, currentPlayer, rivals, partner, onNext }: Props) {
  const [selectedId, setSelectedId]  = useState<string | null | "blank">(null);
  const [isPending, startTransition] = useTransition();

  const candidates = [
    ...rivals,
    partner,
  ].filter(Boolean).filter((p) => p.id !== currentPlayer.id);

  function handleSubmit() {
    if (selectedId === null) { toast.error("Selecciona una opción o deja en blanco"); return; }
    startTransition(async () => {
      try {
        await submitMvpVote(flow.id, selectedId === "blank" ? null : selectedId);
        toast.success("¡Voto registrado!");
        onNext();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al votar");
      }
    });
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏅</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "6px" }}>MVP del Partido</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          ¿Quién ha sido el jugador más determinante en la pista?
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        {candidates.map((player) => (
          <div
            key={player.id}
            onClick={() => setSelectedId(player.id)}
            style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "14px", borderRadius: "14px", cursor: "pointer",
              border:     selectedId === player.id ? "2px solid var(--gold)" : "1px solid var(--border)",
              background: selectedId === player.id ? "rgba(245,158,11,0.1)" : "var(--bg-elevated)",
              transition: "all 0.15s",
            }}
          >
            <Avatar name={player.displayName} src={player.avatarUrl} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: selectedId === player.id ? "var(--gold)" : "var(--text-primary)" }}>
                {player.displayName}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Media {Math.round((player.attrAttack + player.attrDefense + player.attrVolley + player.attrConsistency) / 4)}
              </div>
            </div>
            {selectedId === player.id && (
              <div style={{ fontSize: "24px" }}>⭐</div>
            )}
          </div>
        ))}

        <div
          onClick={() => setSelectedId("blank")}
          style={{
            padding: "12px 14px", borderRadius: "12px", cursor: "pointer",
            border:     selectedId === "blank" ? "2px solid var(--border-strong)" : "1px solid var(--border)",
            background: "var(--bg-elevated)",
            transition: "all 0.15s", textAlign: "center",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Dejar en blanco · No destacar a nadie
          </span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending || selectedId === null}
        style={{
          width: "100%", padding: "14px", borderRadius: "12px", border: "none",
          background:  selectedId !== null ? "linear-gradient(135deg, #f59e0b, #d97706)" : "var(--bg-elevated)",
          color:       selectedId !== null ? "#fff" : "var(--text-muted)",
          fontSize:    "14px", fontWeight: 600, cursor: selectedId !== null ? "pointer" : "not-allowed",
        }}
      >
        {isPending ? "Votando..." : "Siguiente →"}
      </button>
    </div>
  );
}
