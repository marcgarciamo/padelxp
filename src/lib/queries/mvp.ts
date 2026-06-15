import { db } from "@db/index";
import { mvpVotes } from "@db/schema";
import { eq, and, inArray, gt } from "drizzle-orm";

export async function getMatchMvpVotes(matchId: string, matchType: "league" | "tournament") {
  return db.query.mvpVotes.findMany({
    where: and(eq(mvpVotes.matchId, matchId), eq(mvpVotes.matchType, matchType)),
    with: { voter: true, nominee: true },
  });
}

export async function hasPlayerVoted(
  matchId: string, matchType: "league" | "tournament", voterId: string
): Promise<boolean> {
  const vote = await db.query.mvpVotes.findFirst({
    where: and(
      eq(mvpVotes.matchId, matchId),
      eq(mvpVotes.matchType, matchType),
      eq(mvpVotes.voterId, voterId),
      gt(mvpVotes.expiresAt, new Date())
    ),
    columns: { id: true },
  });
  return !!vote;
}

export async function getConfirmedMvp(matchId: string, matchType: "league" | "tournament") {
  return db.query.mvpVotes.findFirst({
    where: and(
      eq(mvpVotes.matchId, matchId),
      eq(mvpVotes.matchType, matchType),
      eq(mvpVotes.confirmed, true)
    ),
    with: { nominee: true },
  });
}

export async function getMvpDataForMatches(
  matchIds: string[],
  matchType: "league" | "tournament",
  currentPlayerId: string
): Promise<Map<string, { totalVotes: number; playerVoted: boolean; confirmedNomineeId: string | null }>> {
  if (matchIds.length === 0) return new Map();

  const allVotes = await db.query.mvpVotes.findMany({
    where: and(
      inArray(mvpVotes.matchId, matchIds),
      eq(mvpVotes.matchType, matchType)
    ),
    columns: { id: true, matchId: true, voterId: true, nomineeId: true, confirmed: true },
  });

  const result = new Map<string, { totalVotes: number; playerVoted: boolean; confirmedNomineeId: string | null }>();

  for (const matchId of matchIds) {
    const votes = allVotes.filter((v) => v.matchId === matchId);
    const confirmed = votes.find((v) => v.confirmed);
    result.set(matchId, {
      totalVotes:          votes.length,
      playerVoted:         votes.some((v) => v.voterId === currentPlayerId),
      confirmedNomineeId:  confirmed?.nomineeId ?? null,
    });
  }

  return result;
}
