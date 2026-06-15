import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getOpenLeagues, getPlayerLeagues } from "@lib/queries/leagues";
import { LeagueCard } from "@components/leagues/league-card";
import { CreateLeagueButton } from "@components/leagues/create-league-button";

export default async function LeaguesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/onboarding");

  const [openLeagues, myLeagues] = await Promise.all([
    getOpenLeagues(),
    getPlayerLeagues(player.id),
  ]);

  const myLeagueIds = new Set(myLeagues.filter(Boolean).map((l) => l?.id));

  return (
    <div style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500 }}>Ligas</h1>
        <CreateLeagueButton />
      </div>

      {myLeagues.length > 0 && (
        <>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            Mis ligas
          </div>
          {myLeagues.filter(Boolean).map((league) => league && (
            <LeagueCard key={league.id} league={league} isMyLeague />
          ))}
          <div style={{ height: "1px", background: "var(--border)", margin: "16px 0" }} />
        </>
      )}

      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
        Ligas abiertas para unirse
      </div>
      {openLeagues.filter((l) => !myLeagueIds.has(l.id)).length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "13px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏆</div>
          <p>No hay ligas abiertas.</p>
          <p style={{ marginTop: "6px" }}>¡Crea la primera!</p>
        </div>
      ) : (
        openLeagues
          .filter((l) => !myLeagueIds.has(l.id))
          .map((league) => <LeagueCard key={league.id} league={league} />)
      )}
    </div>
  );
}
