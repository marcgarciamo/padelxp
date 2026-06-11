import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { CreateChallengeForm } from "@components/challenges/create-challenge-form";
import { PageTransition } from "@components/ui/page-transition";

export default async function NewChallengePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/profile");

  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500 }}>Nuevo Reto</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Desafía a un jugador y apuesta tu XP.</p>
        </div>
        
        <CreateChallengeForm currentPlayer={player} />
      </div>
    </PageTransition>
  );
}
