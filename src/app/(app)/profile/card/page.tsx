"use client";

import { useSession } from "@lib/auth-client";
import { useRouter } from "next/navigation";
import { ShareCardButton } from "@components/player/share-card-button";
import { useEffect, useState } from "react";

export default function PlayerCardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isPending || !mounted) return <div style={{ padding: "2rem", textAlign: "center" }}>Cargando...</div>;
  if (!session) { router.push("/login"); return null; }

  const cardUrl = `/api/og?id=\${session.user.id}`;

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "24px", width: "100%", textAlign: "left" }}>Tu Player Card</h1>

      {/* Preview de la card */}
      <div style={{ 
        width: "100%", 
        maxWidth: "320px", 
        aspectRatio: "2/3", 
        marginBottom: "24px",
        filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))",
        background: "var(--bg-elevated)",
        borderRadius: "24px",
        position: "relative",
        overflow: "hidden",
        border: "1px solid var(--border)"
      }}>
        <img
          src={cardUrl}
          alt="Player card"
          style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
        />
      </div>

      <div style={{ width: "100%" }}>
        <ShareCardButton playerId={session.user.id} playerName={session.user.name} />
      </div>
      
      <p style={{ marginTop: "16px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
        Las estadísticas evolucionan con tu progreso.
      </p>
    </div>
  );
}
