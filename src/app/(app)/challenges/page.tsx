import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getPlayerChallenges } from "@lib/queries/tournaments";
import { ChallengeCard } from "@components/challenges/challenge-card";
import Link from "next/link";

export default async function ChallengesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/profile");

  const challenges = await getPlayerChallenges(player.id);
  const pending    = challenges.filter((c) => c.status === "pending" && c.challengedId === player.id);
  const active     = challenges.filter((c) => c.status === "accepted");
  const history    = challenges.filter((c) => ["completed", "rejected"].includes(c.status));

  return (
    <div style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500 }}>Retos</h1>
        <Link
          href="/challenges/new"
          style={{ background: "var(--accent)", color: "#fff", padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, textDecoration: "none" }}
        >
          + Retar
        </Link>
      </div>

      {pending.length > 0 && (
        <>
          <h2 style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            Pendientes ({pending.length})
          </h2>
          {pending.map((c) => <ChallengeCard key={c.id} challenge={c} currentPlayerId={player.id} />)}
        </>
      )}

      {active.length > 0 && (
        <>
          <h2 style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "16px 0 8px" }}>
            Activos
          </h2>
          {active.map((c) => <ChallengeCard key={c.id} challenge={c} currentPlayerId={player.id} />)}
        </>
      )}

      {history.length > 0 && (
        <>
          <h2 style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "16px 0 8px" }}>
            Historial
          </h2>
          {history.map((c) => <ChallengeCard key={c.id} challenge={c} currentPlayerId={player.id} />)}
        </>
      )}

      {challenges.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "13px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚔️</div>
          <p>No tienes retos activos.</p>
          <p style={{ marginTop: "6px" }}>Reta a un jugador para apostar XP.</p>
        </div>
      )}
    </div>
  );
}
