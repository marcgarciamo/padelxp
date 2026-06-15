import { db } from "@db/index";
import { leagues, leagueTeams, leagueRounds, leagueMatches } from "@db/schema";
import { eq, desc, asc, and, or } from "drizzle-orm";

export async function getOpenLeagues() {
  return db.query.leagues.findMany({
    where: eq(leagues.status, "open"),
    orderBy: [desc(leagues.createdAt)],
    with: { teams: true },
  });
}

export async function getLeagueById(id: string) {
  return db.query.leagues.findFirst({
    where: eq(leagues.id, id),
    with: {
      teams: {
        with: { player1: true, player2: true },
      },
      rounds: {
        orderBy: [asc(leagueRounds.roundNumber)],
        with: {
          matches: {
            with: {
              team1: { with: { player1: true, player2: true } },
              team2: { with: { player1: true, player2: true } },
            },
          },
        },
      },
    },
  });
}

export async function getPlayerLeagues(playerId: string) {
  const playerTeams = await db.query.leagueTeams.findMany({
    where: (t, { or, eq }) => or(
      eq(t.player1Id, playerId),
      eq(t.player2Id, playerId)
    ),
    with: { league: true },
  });
  return playerTeams.map((t) => t.league);
}

export async function getUpcomingLeagueMatches(leagueId: string, teamId: string) {
  return db.query.leagueMatches.findMany({
    where: and(
      eq(leagueMatches.leagueId, leagueId),
      or(
        eq(leagueMatches.team1Id, teamId),
        eq(leagueMatches.team2Id, teamId)
      )
    ),
    with: {
      round: true,
      team1: { with: { player1: true, player2: true } },
      team2: { with: { player1: true, player2: true } },
    },
    orderBy: [asc(leagueMatches.id)],
  });
}
