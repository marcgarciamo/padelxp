import { db } from "@db/index";
import { matches } from "@db/schema";
import { desc, or, eq } from "drizzle-orm";

export async function getRecentMatches(playerId: string, limit = 10) {
  return db.query.matches.findMany({
    where: or(
      eq(matches.team1Player1Id, playerId),
      eq(matches.team1Player2Id, playerId),
      eq(matches.team2Player1Id, playerId),
      eq(matches.team2Player2Id, playerId),
    ),
    orderBy: [desc(matches.playedAt)],
    limit,
    with: {
      team1Player1: true,
      team1Player2: true,
      team2Player1: true,
      team2Player2: true,
    },
  });
}

export async function getAllMatches(limit = 20, offset = 0) {
  return db.query.matches.findMany({
    orderBy: [desc(matches.playedAt)],
    limit,
    offset,
    with: {
      team1Player1: true,
      team1Player2: true,
      team2Player1: true,
      team2Player2: true,
    },
  });
}
