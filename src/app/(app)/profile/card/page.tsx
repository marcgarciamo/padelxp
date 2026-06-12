import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import PlayerCard from "@components/player/player-card";
import { ShareButton, DownloadButton, CopyLinkButton } from "@components/profile/card-actions";

export default async function ProfileCardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/profile");

  const cardUrl = `/api/og?id=${player.id}`;

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
        <ShareButton cardUrl={cardUrl} playerName={player.displayName} />
        <DownloadButton cardUrl={cardUrl} playerName={player.displayName} />
        <CopyLinkButton cardUrl={cardUrl} />
      </div>
    </div>
  );
}
