"use client";

import { useState, useTransition } from "react";
import { Input } from "@components/ui/input";
import { Avatar } from "@components/player/avatar";
import { sendFriendRequest } from "@lib/actions/social";
import { toast } from "sonner";

interface Props { currentPlayerId: string; }

export function PlayerSearchBar({ currentPlayerId }: Props) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
  }

  async function handleAdd(playerId: string, name: string) {
    startTransition(async () => {
      try {
        await sendFriendRequest(playerId);
        toast.success(`Solicitud enviada a ${name}`);
        setResults([]);
        setQuery("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al enviar solicitud");
      }
    });
  }

  return (
    <div style={{ position: "relative", marginBottom: "8px" }}>
      <Input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Buscar jugadores por username..."
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", width: "100%" }}
      />
      {results.length > 0 && (
        <div style={{
          position:   "absolute",
          top:        "100%",
          left:       0,
          right:      0,
          background: "var(--bg-elevated)",
          border:     "1px solid var(--border)",
          borderRadius: "0 0 12px 12px",
          zIndex:     20,
          maxHeight:  "240px",
          overflowY:  "auto",
        }}>
          {results.map((p: any) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
              <Avatar name={p.displayName} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 500 }}>{p.displayName}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>@{p.username} · {p.elo} ELO</div>
              </div>
              <button
                onClick={() => handleAdd(p.id, p.displayName)}
                disabled={isPending}
                style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", cursor: "pointer" }}
              >
                + Amigos
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
