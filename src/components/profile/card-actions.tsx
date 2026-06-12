"use client";

import { useState } from "react";
import { Download, Share2, Copy, Check } from "lucide-react";

export function ShareButton({ cardUrl, playerName }: { cardUrl: string; playerName: string }) {
  return (
    <button
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: "Mi tarjeta en PadelXP",
              text: `Soy ${playerName} en PadelXP. ¡Mira mi tarjeta!`,
              url: cardUrl,
            });
          } catch (err) {
            console.log("Share cancelled");
          }
        } else {
          alert("Web Share API no soportado en este navegador");
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px 16px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s",
        color: "var(--text-primary)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-secondary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-elevated)";
      }}
    >
      <Share2 size={16} />
      Compartir
    </button>
  );
}

export function DownloadButton({ cardUrl, playerName }: { cardUrl: string; playerName: string }) {
  return (
    <button
      onClick={() => {
        const link = document.createElement("a");
        link.href = cardUrl;
        link.download = `${playerName.replace(/\s+/g, "_")}_PadelXP.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px 16px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s",
        color: "var(--text-primary)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-secondary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-elevated)";
      }}
    >
      <Download size={16} />
      Descargar PNG
    </button>
  );
}

export function CopyLinkButton({ cardUrl }: { cardUrl: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(cardUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px 16px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s",
        color: copied ? "var(--color-success)" : "var(--text-primary)",
      }}
      onMouseEnter={(e) => {
        if (!copied) e.currentTarget.style.background = "var(--bg-secondary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-elevated)";
      }}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Copiado" : "Copiar enlace"}
    </button>
  );
}
