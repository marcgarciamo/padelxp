import { getTournamentById } from "@lib/queries/tournaments";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getAcceptedFriends } from "@lib/queries/social";
import { BracketView } from "@components/tournaments/bracket-view";
import { getMvpDataForMatches } from "@lib/queries/mvp";
import { MvpVotePanel } from "@components/mvp/mvp-vote-panel";
import { StartTournamentButton } from "@components/tournaments/start-tournament-button";
import { JoinTournamentForm } from "@components/tournaments/join-tournament-form";
import { TournamentWinnerCelebration } from "@components/tournaments/tournament-winner-celebration";
import { TournamentAdminControls } from "@components/tournaments/tournament-admin-controls";
import { Avatar } from "@components/player/avatar";
import type { TournamentTeam, TournamentRound } from "@db/schema";

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = await params;

  // Evitar que Drizzle intente buscar un UUID inválido y rompa el Server Component
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) notFound();

  const session   = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  const [tournament, friends] = await Promise.all([
    getTournamentById(id),
    currentPlayer ? getAcceptedFriends(currentPlayer.id) : Promise.resolve([]),
  ]);

  if (!tournament) notFound();

  const isCreator  = tournament.createdBy === currentPlayer?.id;
  const isOpen     = tournament.status === "open";
  const isInProgress = tournament.status === "in_progress";
  const isFinished = tournament.status === "finished";
  const teams      = tournament.teams ?? [];
  const teamCount  = teams.length;

  const isRegistered = teams.some(t => t.player1Id === currentPlayer?.id || t.player2Id === currentPlayer?.id);

  // Partidos completados donde participa el jugador actual
  const allTournamentMatches = tournament.rounds?.flatMap((r) => r.matches ?? []) ?? [];
  const playedTournamentMatches = allTournamentMatches.filter((m) => m.winnerId);
  const myTournamentMatches = currentPlayer ? playedTournamentMatches.filter((m) => {
    const ids = [m.team1?.player1Id, m.team1?.player2Id, m.team2?.player1Id, m.team2?.player2Id];
    return ids.includes(currentPlayer.id);
  }) : [];

  const tournamentMvpData = currentPlayer && myTournamentMatches.length > 0
    ? await getMvpDataForMatches(myTournamentMatches.map((m) => m.id), "tournament", currentPlayer.id)
    : new Map();

  // Encontrar ganador del torneo
  const lastRound = tournament.rounds?.[tournament.rounds.length - 1];
  const finalMatch = lastRound?.matches?.[0];
  const winnerTeam = finalMatch?.winner;

  return (
    <div style={{ padding: "1.25rem" }}>
      {isFinished && winnerTeam && (
        <TournamentWinnerCelebration winnerName={winnerTeam.name ?? "Equipo Ganador"} />
      )}

      {isCreator && (
        <TournamentAdminControls tournamentId={id} tournament={tournament} />
      )}

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
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>👥 {teamCount}/{tournament.maxTeams} equipos</span>
          <span>📋 {tournament.format === "elimination" ? "Eliminatoria" : "Todos contra todos"}</span>
          {tournament.creator && (
            <span style={{ color: "var(--accent-light)" }}>👤 Organizado por @{tournament.creator.username}</span>
          )}
        </div>
        {isFinished && (
          <div style={{ marginTop: "12px", padding: "8px 12px", background: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--accent)", color: "var(--accent-light)", fontSize: "12px", fontWeight: 600, textAlign: "center" }}>
            ✨ TORNEO FINALIZADO ✨
          </div>
        )}
      </div>

      {isOpen && currentPlayer && !isRegistered && (
        <JoinTournamentForm
          tournamentId={id}
          currentPlayer={currentPlayer}
          friends={friends}
        />
      )}

      {isOpen && isRegistered && (
        <div className="card" style={{ padding: "16px", marginBottom: "16px", border: "1px solid var(--green)", background: "rgba(34, 197, 94, 0.05)", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "var(--green)", fontWeight: 500 }}>✅ ¡Ya estás inscrito en este torneo!</p>
        </div>
      )}

      {isOpen && isCreator && teamCount >= 4 && (
        <StartTournamentButton tournamentId={id} />
      )}

      {/* Lista de Participantes */}
      {isOpen && teams.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
            Equipos Inscritos ({teamCount})
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {teams.map((team: TournamentTeam & { player1?: any; player2?: any }) => (
              <div key={team.id} className="card" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{team.name}</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <Avatar name={team.player1?.displayName ?? ""} src={team.player1?.avatarUrl} playerId={team.player1Id} size={20} />
                  <Avatar name={team.player2?.displayName ?? ""} src={team.player2?.avatarUrl} playerId={team.player2Id} size={20} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(isInProgress || isFinished) && tournament.rounds && (
        <BracketView
          rounds={tournament.rounds}
          isCreator={isCreator}
          isFinished={isFinished}
        />
      )}

      {currentPlayer && myTournamentMatches.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
            Votar MVP · Mis partidos
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {myTournamentMatches.map((m: any) => {
              const t1p1Id = m.team1?.player1Id as string;
              const t1p2Id = m.team1?.player2Id as string;
              const t2p1Id = m.team2?.player1Id as string;
              const t2p2Id = m.team2?.player2Id as string;
              const isTeam1 = [t1p1Id, t1p2Id].includes(currentPlayer.id);
              const rivals: any[] = isTeam1
                ? [m.team2?.player1, m.team2?.player2].filter(Boolean)
                : [m.team1?.player1, m.team1?.player2].filter(Boolean);
              const md = tournamentMvpData.get(m.id);
              const confirmedMvp = md?.confirmedNomineeId
                ? rivals.find((r: any) => r.id === md.confirmedNomineeId) ?? null
                : null;
              const expiresAt = m.playedAt
                ? new Date(new Date(m.playedAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
              if (rivals.length < 2) return null;
              return (
                <div key={m.id} className="card" style={{ padding: "14px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    {m.team1?.name} vs {m.team2?.name}
                  </div>
                  <MvpVotePanel
                    matchId={m.id}
                    matchType="tournament"
                    currentPlayer={currentPlayer}
                    rivals={rivals}
                    team1Player1Id={t1p1Id}
                    team1Player2Id={t1p2Id}
                    team2Player1Id={t2p1Id}
                    team2Player2Id={t2p2Id}
                    alreadyVoted={md?.playerVoted ?? false}
                    confirmedMvp={confirmedMvp}
                    expiresAt={expiresAt}
                    totalVotes={md?.totalVotes ?? 0}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
