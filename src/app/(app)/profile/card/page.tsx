"use client";

import { useEffect, useState } from "react";
import PlayerCard from "@components/player/player-card";
import { Download, Share2, Copy, Check } from "lucide-react";

interface Player {
  id: string;
  displayName: string;
  elo: number;
  level: number;
  position?: string | null;
  attrAttack: number;
  attrDefense: number;
  attrVolley: number;
  attrConsistency: number;
  totalWins: number;
  totalLosses: number;
  avatarUrl?: string | null;
}

export default function ProfileCardPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPlayer() {
      try {
        const session = await fetch("/api/auth/session").then((r) => r.json());
        if (!session?.user?.id) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch(`/api/players/profile?userId=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPlayer(data);
        }
      } catch (error) {
        console.error("Failed to load player:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPlayer();
  }, []);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Cargando...</div>;
  if (!player) return <div style={{ padding: "2rem", textAlign: "center" }}>Jugador no encontrado</div>;

  const cardUrl = `/api/og?id=${player.id}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mi tarjeta en PadelXP",
          text: `Soy ${player.displayName} en PadelXP. ¡Mira mi tarjeta!`,
          url: cardUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      alert("Web Share API no soportado en este navegador");
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = cardUrl;
    link.download = `${player.displayName.replace(/\s+/g, "_")}_PadelXP.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh" }}>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "0.5rem" }}>Mi Tarjeta</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Comparte tu tarjeta de jugador</p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
        <PlayerCard player={player} size="md" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "320px", margin: "0 auto" }}>
        <button onClick={handleShare} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s", color: "var(--text-primary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}>
          <Share2 size={16} />
          Compartir
        </button>

        <button onClick={handleDownload} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s", color: "var(--text-primary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}>
          <Download size={16} />
          Descargar PNG
        </button>

        <button onClick={handleCopyLink} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s", color: copied ? "var(--color-success)" : "var(--text-primary)" }} onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
    </div>
  );
}
