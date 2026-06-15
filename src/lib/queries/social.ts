import { db } from "@db/index";
import { players, friendships, notifications, matchReactions, tournamentInvitations } from "@db/schema";
import { eq, ilike, and, or, ne, desc, inArray, count } from "drizzle-orm";

// ── Búsqueda de jugadores ──────────────────────────────────────────────────

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

// ── Estado de amistad entre dos jugadores ─────────────────────────────────

export async function getFriendshipStatus(playerId: string, targetId: string) {
  return db.query.friendships.findFirst({
    where: or(
      and(eq(friendships.requesterId, playerId), eq(friendships.addresseeId, targetId)),
      and(eq(friendships.requesterId, targetId), eq(friendships.addresseeId, playerId))
    ),
  });
}

// ── Lista de amigos aceptados ─────────────────────────────────────────────

export async function getAcceptedFriends(playerId: string) {
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
    where: inArray(players.id, friendIds),
    orderBy: [desc(players.elo)],
  });
}

// ── Solicitudes de amistad pendientes ────────────────────────────────────

export async function getPendingFriendRequests(playerId: string) {
  try {
    return await db.query.friendships.findMany({
      where: and(
        eq(friendships.addresseeId, playerId),
        eq(friendships.status, "pending")
      ),
      with: { requester: true },
      orderBy: [desc(friendships.createdAt)],
    });
  } catch (error) {
    console.error("Error in getPendingFriendRequests:", error);
    return [];
  }
}

// Para compatibilidad hacia atrás
export async function getPendingRequests(playerId: string) {
  return getPendingFriendRequests(playerId);
}

// ── Rankings de amigos ────────────────────────────────────────────────────

export async function getFriendsLeaderboard(playerId: string) {
  const friends = await getAcceptedFriends(playerId);
  const currentPlayer = await db.query.players.findFirst({
    where: eq(players.id, playerId),
  });
  if (!currentPlayer) return friends;
  return [...friends, currentPlayer].sort((a, b) => b.elo - a.elo);
}

// ── Notificaciones ────────────────────────────────────────────────────────

export async function getNotifications(playerId: string, limit = 30) {
  try {
    return await db.query.notifications.findMany({
      where: eq(notifications.playerId, playerId),
      orderBy: [desc(notifications.createdAt)],
      limit,
      with: { fromPlayer: true },
    });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return [];
  }
}

export async function getUnreadCount(playerId: string): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(notifications)
    .where(and(eq(notifications.playerId, playerId), eq(notifications.read, false)));
  return result?.total ?? 0;
}

// ── Invitaciones de torneo pendientes ────────────────────────────────────

export async function getPendingTournamentInvitations(playerId: string) {
  try {
    return await db.query.tournamentInvitations.findMany({
      where: and(
        eq(tournamentInvitations.inviteeId, playerId),
        eq(tournamentInvitations.status, "pending")
      ),
      with: {
        tournament: true,
        inviter:    true,
      },
      orderBy: [desc(tournamentInvitations.createdAt)],
    });
  } catch (error) {
    console.error("Error in getPendingTournamentInvitations:", error);
    return [];
  }
}

// ── Reacciones de partido ─────────────────────────────────────────────────

export async function getMatchReactions(matchId: string) {
  return db.query.matchReactions.findMany({
    where: eq(matchReactions.matchId, matchId),
    with: { player: true },
  });
}
