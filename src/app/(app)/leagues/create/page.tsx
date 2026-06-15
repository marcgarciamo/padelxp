import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { CreateLeagueStepper } from "@components/leagues/create-league-stepper";

export default async function CreateLeaguePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/onboarding");

  return (
    <div style={{ padding: "1.25rem", maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <a href="/leagues" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "13px" }}>← Ligas</a>
      </div>
      <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "20px" }}>Crear liga</h1>
      <CreateLeagueStepper />
    </div>
  );
}
