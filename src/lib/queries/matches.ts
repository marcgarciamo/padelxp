import { db } from "@db/index";
import { matches, postmatchCompletions } from "@db/schema";
import { desc, or, eq, and } from "drizzle-orm";

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

export async function getPendingFlowsByPlayer(playerId: string): Promise<Map<string, string>> {
  const completions = await db.query.postmatchCompletions.findMany({
    where: and(
      eq(postmatchCompletions.playerId, playerId),
    ),
    with: { flow: true },
  });

  const map = new Map<string, string>();
  for (const c of completions) {
    const flow = c.flow;
    if (!flow) continue;
    if (flow.status === "completed" || flow.status === "expired") continue;
    if (c.validated && c.mvpVoted && c.prestigeDone) continue;
    map.set(flow.matchId, flow.id);
  }
  return map;
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
