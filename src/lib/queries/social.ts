import { db } from "@db/index";
import { players, friendships, notifications, matchReactions } from "@db/schema";
import { eq, ilike, and, or, ne, desc, count } from "drizzle-orm";

export async function searchPlayers(query: string, currentPlayerId: string) {
  if (query.length < 2) return [];
  return db.query.players.findMany({
    where: and(
      or(
        ilike(players.username, `%${query}%`),
        ilike(players.displayName, `%${query}%`)
      ),
      ne(players.id, currentPlayerId)
    ),
    limit: 20,
  });
}

export async function getFriendshipStatus(
  playerId: string,
  targetId: string
) {
  return db.query.friendships.findFirst({
    where: or(
      and(eq(friendships.requesterId, playerId), eq(friendships.addresseeId, targetId)),
      and(eq(friendships.requesterId, targetId), eq(friendships.addresseeId, playerId))
    ),
  });
}

export async function getPendingRequests(playerId: string) {
  return db.query.friendships.findMany({
    where: and(
      eq(friendships.addresseeId, playerId),
      eq(friendships.status, "pending")
    ),
    with: { requester: true },
  });
}

export async function getNotifications(playerId: string, limit = 20) {
  return db.query.notifications.findMany({
    where: eq(notifications.playerId, playerId),
    orderBy: [desc(notifications.createdAt)],
    limit,
    with: { fromPlayer: true },
  });
}

export async function getUnreadCount(playerId: string): Promise<number> {
  const [result] = await db.select({ count: count() }).from(notifications).where(
    and(
      eq(notifications.playerId, playerId),
      eq(notifications.read, false)
    )
  );
  return result?.count ?? 0;
}

export async function getMatchReactions(matchId: string) {
  return db.query.matchReactions.findMany({
    where: eq(matchReactions.matchId, matchId),
    with: { player: true },
  });
}

export async function getFriendsLeaderboard(playerId: string) {
  const accepted = await db.query.friendships.findMany({
    where: and(
      or(
        eq(friendships.requesterId, playerId),
        eq(friendships.addresseeId, playerId)
      ),
      eq(friendships.status, "accepted")
    ),
  });
  const friendIds = [
    playerId,
    ...accepted.map((f) =>
      f.requesterId === playerId ? f.addresseeId : f.requesterId
    ),
  ];
  return db.query.players.findMany({
    where: (p, { inArray }) => inArray(p.id, friendIds),
    orderBy: (p, { desc }) => [desc(p.elo)],
  });
}
