import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { ShareCardButton } from "@components/player/share-card-button";

export default async function PlayerCardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/profile");

  const cardUrl = `/api/og?id=${player.id}`;

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "24px", width: "100%", textAlign: "left" }}>Tu Player Card</h1>

      {/* Preview de la card estilizada */}
      <div style={{ 
        width: "100%", 
        maxWidth: "320px", 
        aspectRatio: "2/3", 
        marginBottom: "24px",
        filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))",
        background: "var(--bg-elevated)",
        borderRadius: "24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <img
          src={cardUrl}
          alt="Player card"
          style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
        />
      </div>

      <div style={{ width: "100%" }}>
        <ShareCardButton playerId={player.id} playerName={player.displayName} />
      </div>
      
      <p style={{ marginTop: "16px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
        ¡Las estadísticas y el color de la carta evolucionan con tu nivel!
      </p>
    </div>
  );
}
