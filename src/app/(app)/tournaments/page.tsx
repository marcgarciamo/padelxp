import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getOpenTournaments, getOpenLeagues } from "@lib/queries/tournaments";
import { TournamentCard } from "@components/tournaments/tournament-card";
import { LeagueCard } from "@components/tournaments/league-card";
import Link from "next/link";

export default async function TournamentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [currentPlayer, openTournaments, openLeagues] = await Promise.all([
    getPlayerByUserId(session.user.id),
    getOpenTournaments(),
    getOpenLeagues(),
  ]);

  return (
    <div style={{ padding: "1.25rem" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500 }}>Torneos</h1>
      </div>

      <h2 style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
        Eliminatorias abiertas
      </h2>
      {openTournaments.length === 0 ? (
        <div className="card" style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>
          No hay torneos abiertos. ¡Crea el primero!
        </div>
      ) : (
        openTournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)
      )}

      <h2 style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "20px 0 12px" }}>
        Ligas activas
      </h2>
      {openLeagues.length === 0 ? (
        <div className="card" style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
          No hay ligas abiertas.
        </div>
      ) : (
        openLeagues.map((l) => <LeagueCard key={l.id} league={l} />)
      )}
    </div>
  );
}
