"use server";

import { db } from "@db/index";
import { friendships, notifications, matchReactions, tournamentInvitations, tournamentTeams } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId, getPlayerById } from "@lib/queries/players";
import { getFriendshipStatus } from "@lib/queries/social";

export async function sendFriendRequest(targetPlayerId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("Jugador no encontrado");

  const existing = await getFriendshipStatus(currentPlayer.id, targetPlayerId);
  if (existing) throw new Error("Solicitud ya existente");

  await db.transaction(async (tx) => {
    await tx.insert(friendships).values({
      requesterId: currentPlayer.id,
      addresseeId: targetPlayerId,
      status:      "pending",
    });

    await tx.insert(notifications).values({
      playerId:     targetPlayerId,
      type:         "friend_request",
      fromPlayerId: currentPlayer.id,
      message:      `${currentPlayer.displayName} quiere añadirte a amigos`,
    });
  });

  revalidatePath("/crew");
}

export async function acceptFriendRequest(friendshipId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("Jugador no encontrado");

  const friendship = await db.query.friendships.findFirst({
    where: eq(friendships.id, friendshipId),
  });
  if (!friendship || friendship.addresseeId !== currentPlayer.id) {
    throw new Error("Solicitud no encontrada");
  }

  await db.transaction(async (tx) => {
    await tx.update(friendships)
      .set({ status: "accepted" })
      .where(eq(friendships.id, friendshipId));

    await tx.insert(notifications).values({
      playerId:     friendship.requesterId,
      type:         "friend_accepted",
      fromPlayerId: currentPlayer.id,
      message:      `${currentPlayer.displayName} aceptó tu solicitud de amistad`,
    });
  });

  revalidatePath("/crew");
  revalidatePath("/rankings");
}

export async function rejectFriendRequest(friendshipId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("Jugador no encontrado");

  const friendship = await db.query.friendships.findFirst({
    where: eq(friendships.id, friendshipId),
  });
  if (!friendship || friendship.addresseeId !== currentPlayer.id) {
    throw new Error("Solicitud no encontrada");
  }

  await db.delete(friendships).where(eq(friendships.id, friendshipId));
  revalidatePath("/crew");
}

export async function removeFriend(targetPlayerId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("Jugador no encontrado");

  const friendship = await getFriendshipStatus(currentPlayer.id, targetPlayerId);
  if (friendship) {
    await db.delete(friendships).where(eq(friendships.id, friendship.id));
  }
  revalidatePath("/crew");
}

export async function toggleReaction(matchId: string, emoji: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("Jugador no encontrado");

  const existing = await db.query.matchReactions.findFirst({
    where: and(
      eq(matchReactions.matchId, matchId),
      eq(matchReactions.playerId, currentPlayer.id),
      eq(matchReactions.emoji, emoji)
    ),
  });

  if (existing) {
    await db.delete(matchReactions).where(eq(matchReactions.id, existing.id));
  } else {
    await db.insert(matchReactions).values({
      matchId,
      playerId: currentPlayer.id,
      emoji,
    });
  }

  revalidatePath("/matches");
  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.playerId, player.id));
  revalidatePath("/notifications");
}

// ── Invitaciones de torneo ────────────────────────────────────────────────

export async function acceptTournamentInvitation(invitationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("No autenticado");

  const invitation = await db.query.tournamentInvitations.findFirst({
    where: eq(tournamentInvitations.id, invitationId),
    with: { tournament: true, inviter: true },
  });

  if (!invitation || invitation.inviteeId !== currentPlayer.id) {
    throw new Error("Invitación no encontrada");
  }
  if (invitation.status !== "pending") {
    throw new Error("Esta invitación ya fue procesada");
  }

  await db.transaction(async (tx) => {
    // Crear el equipo en el torneo
    const [team] = await tx.insert(tournamentTeams).values({
      tournamentId: invitation.tournamentId,
      player1Id:    invitation.inviterId,
      player2Id:    currentPlayer.id,
      name:         `${invitation.inviter.displayName.split(" ")[0]} & ${currentPlayer.displayName.split(" ")[0]}`,
    }).returning();

    // Actualizar invitación
    await tx.update(tournamentInvitations)
      .set({ status: "accepted", tournamentTeamId: team?.id, updatedAt: new Date() })
      .where(eq(tournamentInvitations.id, invitationId));

    // Notificar al invitador
    await tx.insert(notifications).values({
      playerId:     invitation.inviterId,
      type:         "friend_accepted",
      fromPlayerId: currentPlayer.id,
      message:      `${currentPlayer.displayName} aceptó unirse contigo al torneo "${invitation.tournament.name}" 🏆`,
    });

    // Marcar notificación de invitación como leída
    await tx.update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.playerId, currentPlayer.id),
          eq(notifications.type, "match_registered")
        )
      );
  });

  revalidatePath("/tournaments");
  revalidatePath("/notifications");
}

export async function rejectTournamentInvitation(invitationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("No autenticado");

  const invitation = await db.query.tournamentInvitations.findFirst({
    where: eq(tournamentInvitations.id, invitationId),
    with: { tournament: true },
  });

  if (!invitation || invitation.inviteeId !== currentPlayer.id) {
    throw new Error("Invitación no encontrada");
  }

  await db.transaction(async (tx) => {
    await tx.update(tournamentInvitations)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(tournamentInvitations.id, invitationId));

    await tx.insert(notifications).values({
      playerId:     invitation.inviterId,
      type:         "friend_request",
      fromPlayerId: currentPlayer.id,
      message:      `${currentPlayer.displayName} rechazó la invitación al torneo "${invitation.tournament.name}"`,
    });

    await tx.update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.playerId, currentPlayer.id),
          eq(notifications.type, "match_registered")
        )
      );
  });

  revalidatePath("/notifications");
}
