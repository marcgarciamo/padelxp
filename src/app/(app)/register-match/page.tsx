import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getLeaderboard } from "@lib/queries/players";
import { RegisterMatchForm } from "@components/forms/register-match-form";

export default async function RegisterMatchPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  const allPlayers    = await getLeaderboard(50);
  const otherPlayers  = allPlayers.filter((p) => p.id !== currentPlayer?.id);

  return (
    <div style={{ padding: "1.25rem" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "16px" }}>Nuevo partido</h1>
      {currentPlayer ? (
        <RegisterMatchForm
          currentPlayer={currentPlayer}
          availablePlayers={otherPlayers}
        />
      ) : (
        <p style={{ color: "var(--text-muted)" }}>Completa tu perfil primero.</p>
      )}
    </div>
  );
}
