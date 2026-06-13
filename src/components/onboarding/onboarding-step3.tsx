"use client";

import { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Avatar } from "@components/player/avatar";
import type { Player } from "@db/schema";

interface Props {
  availablePlayers: Player[];
  onNext:           (firstFriendId?: string) => void;
  onSkip:           () => void;
  onBack:           () => void;
  saving:           boolean;
}

export function OnboardingStep3({ availablePlayers, onNext, onSkip, onBack, saving }: Props) {
  const [query,      setQuery]      = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = query.length >= 2
    ? availablePlayers.filter((p) =>
        p.displayName.toLowerCase().includes(query.toLowerCase()) ||
        p.username.toLowerCase().includes(query.toLowerCase())
      )
    : availablePlayers.slice(0, 5);

  const selectedPlayer = availablePlayers.find((p) => p.id === selectedId);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>👥</div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
          ¿Conoces a alguien en PadelXP?
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Añade tu primer compañero de crew para ver sus partidos y rankings
        </p>
      </div>

      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }}
        placeholder="Buscar por nombre o username..."
        style={{
          background:   "var(--bg-elevated)",
          border:       "1px solid var(--border)",
          color:        "var(--text-primary)",
          width:        "100%",
          marginBottom: "10px",
        }}
      />

      <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
        {filtered.length === 0 && query.length >= 2 && (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>
            No se encontraron jugadores con &quot;{query}&quot;
          </p>
        )}
        {filtered.map((player) => (
          <div
            key={player.id}
            onClick={() => setSelectedId(player.id === selectedId ? null : player.id)}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "10px",
              padding:      "10px 12px",
              borderRadius: "10px",
              border:       selectedId === player.id
                ? "1px solid var(--accent)"
                : "1px solid var(--border)",
              background:   selectedId === player.id
                ? "rgba(124,92,252,0.1)"
                : "var(--bg-elevated)",
              cursor:       "pointer",
              transition:   "all 0.15s",
            }}
          >
            <Avatar name={player.displayName} src={player.avatarUrl} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 500 }}>{player.displayName}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>@{player.username} · {player.elo} ELO</div>
            </div>
            {selectedId === player.id && (
              <div style={{ color: "var(--accent-light)", fontSize: "16px" }}>✓</div>
            )}
          </div>
        ))}
      </div>

      {selectedPlayer && (
        <div style={{
          padding:      "10px 14px",
          borderRadius: "10px",
          background:   "rgba(124,92,252,0.1)",
          border:       "1px solid rgba(124,92,252,0.3)",
          marginBottom: "14px",
          fontSize:     "12px",
          color:        "var(--accent-light)",
        }}>
          Se enviará solicitud de amistad a <strong>{selectedPlayer.displayName}</strong>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button
          onClick={() => onNext(selectedId ?? undefined)}
          disabled={saving}
          style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "14px", width: "100%" }}
        >
          {saving ? "Creando tu perfil..." : selectedId ? "Añadir al crew y empezar 🚀" : "Empezar sin crew →"}
        </Button>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onBack}
            disabled={saving}
            style={{
              flex:         1,
              padding:      "10px",
              borderRadius: "10px",
              border:       "1px solid var(--border)",
              background:   "var(--bg-elevated)",
              color:        "var(--text-muted)",
              fontSize:     "12px",
              cursor:       "pointer",
            }}
          >
            ← Atrás
          </button>
          <button
            onClick={onSkip}
            disabled={saving}
            style={{
              flex:           1,
              padding:        "10px",
              borderRadius:   "10px",
              border:         "none",
              background:     "none",
              color:          "var(--text-muted)",
              fontSize:       "12px",
              cursor:         "pointer",
              textDecoration: "underline",
            }}
          >
            Saltar por ahora
          </button>
        </div>
      </div>
    </div>
  );
}
