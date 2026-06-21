import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getLeagueById } from "@lib/queries/leagues";
import { getAcceptedFriends } from "@lib/queries/social";
import { calculateStandings } from "@lib/league-engine";
import { LeagueStandings } from "@components/leagues/league-standings";
import { LeagueRoundsList } from "@components/leagues/league-rounds-list";
import { JoinLeagueForm } from "@components/leagues/join-league-form";
import { StartLeagueButton } from "@components/leagues/start-league-button";
import { LeagueHeader } from "@components/leagues/league-header";
import { SubmitResultForm } from "@components/leagues/submit-result-form";
import { LeagueInviteActions } from "@components/leagues/league-invite-actions";
import { LeaveLeagueButton } from "@components/leagues/leave-league-button";
import { getMvpDataForMatches } from "@lib/queries/mvp";
import { MvpVotePanel } from "@components/mvp/mvp-vote-panel";

export default async function LeaguePage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id }  = await params;
  const { tab } = await searchParams;
  const activeTab = tab ?? "standings";

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [league, player] = await Promise.all([
    getLeagueById(id),
    getPlayerByUserId(session.user.id),
  ]);

  if (!league) notFound();
  if (!player) redirect("/onboarding");

  const friends = await getAcceptedFriends(player.id);

  const myTeam = league.teams?.find(
    (t) => t.player1Id === player.id || t.player2Id === player.id
  );

  const allInvites = league.invites ?? [];
  const myPendingInviteSent     = allInvites.find((i) => i.inviterId === player.id && i.status === "pending");
  const myPendingInviteReceived = allInvites.find((i) => i.inviteeId === player.id && i.status === "pending");

  const completedMatches = league.rounds
    ?.flatMap((r) => r.matches ?? [])
    .filter((m) => m.winnerId) ?? [];

  const standings = calculateStandings(league.teams ?? [], completedMatches, league.pointsWin ?? 3);

  const allMatches = league.rounds?.flatMap((r) =>
    (r.matches ?? []).map((m) => ({ ...m, roundNumber: r.roundNumber, roundCompleted: r.completed }))
  ) ?? [];

  const upcomingMatches = allMatches.filter((m) => !m.winnerId);
  const playedMatches   = allMatches.filter((m) => m.winnerId);

  const mvpData = await getMvpDataForMatches(
    playedMatches.map((m) => m.id),
    "league",
    player.id
  );

  const isCreator = league.createdBy === player.id;
  const canJoin   = league.status === "open" && !myTeam && !myPendingInviteSent && !myPendingInviteReceived;
  const canLeave  = league.status === "open" && !!myTeam;
  const canStart  = isCreator && league.status === "open" && (league.teams?.length ?? 0) >= 3;

  return (
    <div style={{ padding: "1.25rem" }}>
      <LeagueHeader league={league} myTeam={myTeam} isCreator={isCreator} />

      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", overflowX: "auto" }}>
        {[
          { key: "standings", label: "Clasificación" },
          { key: "upcoming",  label: `Próximos (${upcomingMatches.length})` },
          { key: "results",   label: `Resultados (${playedMatches.length})` },
          { key: "rounds",    label: "Jornadas" },
        ].map(({ key, label }) => (
          <a
            key={key}
            href={`/leagues/${id}?tab=${key}`}
            style={{
              padding:        "6px 14px",
              borderRadius:   "20px",
              fontSize:       "12px",
              fontWeight:     activeTab === key ? 600 : 400,
              background:     activeTab === key ? "var(--accent)" : "var(--bg-elevated)",
              color:          activeTab === key ? "#fff" : "var(--text-muted)",
              border:         activeTab === key ? "none" : "1px solid var(--border)",
              textDecoration: "none",
              whiteSpace:     "nowrap",
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {activeTab === "standings" && (
        <LeagueStandings standings={standings} myTeamId={myTeam?.id} />
      )}

      {activeTab === "upcoming" && (
        <LeagueUpcoming matches={upcomingMatches} isCreator={isCreator} currentPlayerId={player.id} />
      )}

      {activeTab === "results" && (
        <LeagueResults matches={playedMatches} currentPlayer={player} mvpData={mvpData} />
      )}

      {activeTab === "rounds" && (
        <LeagueRoundsList rounds={league.rounds ?? []} isCreator={isCreator} leagueId={id} />
      )}

      {myPendingInviteReceived && (
        <div style={{ marginTop: "20px" }}>
          <LeagueInviteActions invite={myPendingInviteReceived as any} currentPlayerId={player.id} />
        </div>
      )}

      {myPendingInviteSent && !myPendingInviteReceived && (
        <div style={{ marginTop: "20px" }}>
          <LeagueInviteActions invite={myPendingInviteSent as any} currentPlayerId={player.id} />
        </div>
      )}

      {canJoin && (
        <div style={{ marginTop: "20px" }}>
          <JoinLeagueForm leagueId={id} friends={friends} currentPlayer={player} />
        </div>
      )}

      {canLeave && (
        <div style={{ marginTop: "12px" }}>
          <LeaveLeagueButton leagueId={id} />
        </div>
      )}

      {canStart && (
        <div style={{ marginTop: "16px" }}>
          <StartLeagueButton leagueId={id} teamCount={league.teams?.length ?? 0} />
        </div>
      )}
    </div>
  );
}

function LeagueUpcoming({ matches, isCreator, currentPlayerId }: { matches: any[]; isCreator: boolean; currentPlayerId: string }) {
  if (matches.length === 0) {
    return <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "13px" }}>No hay partidos pendientes.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {matches.map((m: any) => {
        const isMyMatch = [
          m.team1?.player1?.id, m.team1?.player2?.id,
          m.team2?.player1?.id, m.team2?.player2?.id,
        ].includes(currentPlayerId);
        return (
          <div key={m.id} className="card" style={{ padding: "14px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>Jornada {m.roundNumber}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ fontSize: "13px", fontWeight: 500, flex: 1 }}>
                {m.team1?.player1?.displayName?.split(" ")[0]} & {m.team1?.player2?.displayName?.split(" ")[0]}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "4px 10px", background: "var(--bg-elevated)", borderRadius: "20px" }}>vs</div>
              <div style={{ fontSize: "13px", fontWeight: 500, flex: 1, textAlign: "right" }}>
                {m.team2?.player1?.displayName?.split(" ")[0]} & {m.team2?.player2?.displayName?.split(" ")[0]}
              </div>
            </div>
            {(isCreator || isMyMatch) && (
              <SubmitResultForm
                matchId={m.id} team1Id={m.team1Id} team2Id={m.team2Id}
                team1Name={`${m.team1?.player1?.displayName?.split(" ")[0]} & ${m.team1?.player2?.displayName?.split(" ")[0]}`}
                team2Name={`${m.team2?.player1?.displayName?.split(" ")[0]} & ${m.team2?.player2?.displayName?.split(" ")[0]}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LeagueResults({
  matches,
  currentPlayer,
  mvpData,
}: {
  matches: any[];
  currentPlayer: any;
  mvpData: Map<string, { totalVotes: number; playerVoted: boolean; confirmedNomineeId: string | null }>;
}) {
  if (matches.length === 0) {
    return <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "13px" }}>Aún no hay resultados.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {matches.map((m: any) => {
        const sets = (m.sets as Array<{ team1: number; team2: number }>) ?? [];
        const t1p1Id = m.team1?.player1Id as string | undefined;
        const t1p2Id = m.team1?.player2Id as string | undefined;
        const t2p1Id = m.team2?.player1Id as string | undefined;
        const t2p2Id = m.team2?.player2Id as string | undefined;
        const allIds = [t1p1Id, t1p2Id, t2p1Id, t2p2Id].filter(Boolean) as string[];
        const isParticipant = allIds.includes(currentPlayer.id);
        const isTeam1 = [t1p1Id, t1p2Id].includes(currentPlayer.id);
        const rivals: any[] = isTeam1
          ? [m.team2?.player1, m.team2?.player2].filter(Boolean)
          : [m.team1?.player1, m.team1?.player2].filter(Boolean);
        const md = mvpData.get(m.id);
        const confirmedMvp = md?.confirmedNomineeId
          ? rivals.find((r) => r.id === md.confirmedNomineeId) ?? null
          : null;
        const expiresAt = m.playedAt
          ? new Date(new Date(m.playedAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        return (
          <div key={m.id} className="card" style={{ padding: "14px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>Jornada {m.roundNumber}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: m.winnerId === m.team1Id ? "var(--green)" : "var(--text-muted)" }}>
                {m.team1?.player1?.displayName?.split(" ")[0]} & {m.team1?.player2?.displayName?.split(" ")[0]}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {sets.map((s, i) => (
                  <span key={i} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{s.team1}–{s.team2}</span>
                ))}
              </div>
              <div style={{ flex: 1, fontSize: "13px", fontWeight: 500, textAlign: "right", color: m.winnerId === m.team2Id ? "var(--green)" : "var(--text-muted)" }}>
                {m.team2?.player1?.displayName?.split(" ")[0]} & {m.team2?.player2?.displayName?.split(" ")[0]}
              </div>
            </div>
            {isParticipant && t1p1Id && t1p2Id && t2p1Id && t2p2Id && rivals.length === 2 && (
              <MvpVotePanel
                matchId={m.id}
                matchType="league"
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
            )}
          </div>
        );
      })}
    </div>
  );
}
