import { db } from "@db/index";
import { players, friendships } from "@db/schema";
import { desc, eq, or, and } from "drizzle-orm";

export async function getLeaderboard(limit = 50) {
  return db.query.players.findMany({
    orderBy: [desc(players.elo)],
    limit,
  });
}

export async function getPlayerByUserId(userId: string) {
  return db.query.players.findFirst({
    where: eq(players.userId, userId),
    with: { achievements: true },
  });
}

export async function getPlayerById(id: string) {
  return db.query.players.findFirst({
    where: eq(players.id, id),
    with: { achievements: true },
  });
}

export async function getCrew(playerId: string) {
  const accepted = await db.query.friendships.findMany({
    where: and(
      or(
        eq(friendships.requesterId, playerId),
        eq(friendships.addresseeId, playerId)
      ),
      eq(friendships.status, "accepted")
    ),
  });
  const friendIds = accepted.map((f) =>
    f.requesterId === playerId ? f.addresseeId : f.requesterId
  );
  if (friendIds.length === 0) return [];
  return db.query.players.findMany({
    where: (p, { inArray }) => inArray(p.id, friendIds),
    orderBy: [desc(players.elo)],
  });
}
