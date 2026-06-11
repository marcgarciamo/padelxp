import { getTournamentById } from "@lib/queries/tournaments";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { BracketView } from "@components/tournaments/bracket-view";
import { StartTournamentButton } from "@components/tournaments/start-tournament-button";
import { JoinTournamentForm } from "@components/tournaments/join-tournament-form";

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = await params;

  // Evitar que Drizzle intente buscar un UUID inválido y rompa el Server Component
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) notFound();

  const session   = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [tournament, currentPlayer] = await Promise.all([
    getTournamentById(id),
    getPlayerByUserId(session.user.id),
  ]);

  if (!tournament) notFound();

  const isCreator  = tournament.createdBy === currentPlayer?.id;
  const isOpen     = tournament.status === "open";
  const isInProgress = tournament.status === "in_progress";
  const teamCount  = tournament.teams?.length ?? 0;

  return (
    <div style={{ padding: "1.25rem" }}>
      <div className="card-elevated" style={{ padding: "18px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 500 }}>{tournament.name}</h1>
            {tournament.description && <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{tournament.description}</p>}
          </div>
          <span className="badge-xp" style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
            🏆 {tournament.xpReward} XP
          </span>
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>👥 {teamCount}/{tournament.maxTeams} equipos</span>
          <span>📋 {tournament.format === "elimination" ? "Eliminatoria" : "Todos contra todos"}</span>
        </div>
      </div>

      {isOpen && currentPlayer && (
        <JoinTournamentForm tournamentId={id} currentPlayer={currentPlayer} />
      )}

      {isOpen && isCreator && teamCount >= 4 && (
        <StartTournamentButton tournamentId={id} />
      )}

      {isInProgress && tournament.rounds && (
        <BracketView rounds={tournament.rounds as any} isCreator={isCreator} />
      )}
    </div>
  );
}
