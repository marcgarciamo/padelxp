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

  const cardUrl = `https://padelxp.vercel.app/api/og?id=${player.id}`;

  return (
    <div style={{ padding: "1.25rem" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "16px" }}>Tu Player Card</h1>

      {/* Preview de la card */}
      <div className="card" style={{ padding: "4px", marginBottom: "16px", overflow: "hidden", borderRadius: "12px" }}>
        <img
          src={cardUrl}
          alt="Player card"
          style={{ width: "100%", borderRadius: "10px", display: "block" }}
        />
      </div>

      <ShareCardButton playerId={player.id} playerName={player.displayName} />
    </div>
  );
}
