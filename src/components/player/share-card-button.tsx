"use client";

import { toast } from "sonner";

interface Props {
  playerId:   string;
  playerName: string;
}

export function ShareCardButton({ playerId, playerName }: Props) {
  const cardUrl = `/api/og?id=${playerId}`;
  const sharePath = "/profile/card";

  async function handleShare() {
    const shareUrl = new URL(sharePath, window.location.origin).toString();

    if (navigator.share) {
      await navigator.share({
        title: `${playerName} en PadelXP`,
        text:  `Mira mi player card en PadelXP 🎾`,
        url:   shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    }
  }

  async function handleDownload() {
    const a = document.createElement("a");
    a.href = cardUrl;
    a.download = `padelxp-${playerName.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
    toast.success("Descargando player card...");
  }

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <button
        onClick={handleShare}
        style={{ flex: 1, background: "var(--accent)", color: "#000", border: "none", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
      >
        Compartir card
      </button>
      <button
        onClick={handleDownload}
        style={{ flex: 1, background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
      >
        Descargar PNG
      </button>
    </div>
  );
}
