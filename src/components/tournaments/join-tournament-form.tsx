"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@components/ui/button";
import { joinTournament } from "@lib/actions/tournaments";
import { toast } from "sonner";
import { type Player } from "@db/schema";
import { Avatar } from "@components/player/avatar";
import { Search, X, UserPlus } from "lucide-react";

interface Props {
  tournamentId: string;
  currentPlayer: Player;
}

export function JoinTournamentForm({ tournamentId, currentPlayer }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Player | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Error searching players:", err);
    }
  }

  function handleSelect(player: Player) {
    setSelectedPartner(player);
    setQuery("");
    setResults([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPartner) return toast.error("Selecciona un compañero");

    startTransition(async () => {
      try {
        await joinTournament(tournamentId, selectedPartner.id);
        toast.success("¡Inscritos correctamente!");
        setSelectedPartner(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al unirse");
      }
    });
  }

  return (
    <div className="card" style={{ padding: "18px", marginBottom: "16px", border: "1px solid var(--accent-dim)" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <UserPlus size={16} className="text-accent" />
        Inscribirse al torneo
      </h3>
      
      {!selectedPartner ? (
        <div style={{ position: "relative" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar compañero por username..."
              style={{ 
                background: "var(--bg-elevated)", 
                border: "1px solid var(--border)", 
                borderRadius: "10px", 
                padding: "10px 10px 10px 36px", 
                color: "#fff",
                fontSize: "13px",
                width: "100%"
              }}
            />
          </div>
          
          {results.length > 0 && (
            <div style={{
              position:   "absolute",
              top:        "100%",
              left:       0,
              right:      0,
              background: "var(--bg-elevated)",
              border:     "1px solid var(--border)",
              borderRadius: "0 0 12px 12px",
              zIndex:     50,
              maxHeight:  "200px",
              overflowY:  "auto",
              boxShadow:  "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
            }}>
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  style={{ 
                    display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", 
                    border: "none", borderBottom: "1px solid var(--border)", background: "none",
                    width: "100%", textAlign: "left", cursor: "pointer", color: "inherit"
                  }}
                >
                  <Avatar name={p.displayName} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: 500 }}>{p.displayName}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>@{p.username} · {p.elo} ELO</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          display: "flex", alignItems: "center", gap: "12px", padding: "10px", 
          background: "rgba(124, 92, 252, 0.1)", borderRadius: "10px", border: "1px dashed var(--accent)",
          marginBottom: "12px"
        }}>
          <Avatar name={selectedPartner.displayName} size={32} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedPartner.displayName}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Tu pareja para este torneo</div>
          </div>
          <button 
            onClick={() => setSelectedPartner(null)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: "12px" }}>
        <Button 
          type="submit" 
          disabled={isPending || !selectedPartner} 
          className="btn-primary"
          style={{ width: "100%", border: "none" }}
        >
          {isPending ? "Inscribiendo..." : "Confirmar pareja"}
        </Button>
      </form>
    </div>
  );
}
