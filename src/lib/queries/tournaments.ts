import { db } from "@db/index";
import { tournaments, leagues, challenges } from "@db/schema";
import { eq, desc, or, and, gt } from "drizzle-orm";

export async function getOpenTournaments() {
  return db.query.tournaments.findMany({
    where: eq(tournaments.status, "open"),
    orderBy: [desc(tournaments.createdAt)],
    with: { teams: true, creator: true },
  });
}

export async function getTournamentById(id: string) {
  return db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
    with: {
      creator: true,
      teams:   { with: { player1: true, player2: true } },
      rounds:  { 
        orderBy: (r, { asc }) => [asc(r.roundNumber)],
        with: { matches: { with: { team1: true, team2: true, winner: true } } } 
      },
    },
  });
}

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
      teams:  { orderBy: (t, { desc }) => [desc(t.points)], with: { player1: true, player2: true } },
      rounds: { with: { matches: { with: { team1: true, team2: true } } } },
    },
  });
}

export async function getPlayerChallenges(playerId: string) {
  return db.query.challenges.findMany({
    where: and(
      or(
        eq(challenges.challengerId, playerId),
        eq(challenges.challengedId, playerId)
      ),
      gt(challenges.expiresAt, new Date())
    ),
    orderBy: [desc(challenges.createdAt)],
    with: { challenger: true, challenged: true },
  });
}
