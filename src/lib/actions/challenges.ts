"use server";

import { db } from "@db/index";
import { challenges, notifications, players } from "@db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";

export async function sendChallenge(challengedId: string, xpStake: number, message?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const challenger = await getPlayerByUserId(session.user.id);
  if (!challenger) throw new Error("Jugador no encontrado");
  if (challenger.xp < xpStake) throw new Error("No tienes suficiente XP para apostar");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.transaction(async (tx) => {
    await tx.insert(challenges).values({
      challengerId: challenger.id,
      challengedId,
      xpStake,
      message,
      expiresAt,
    });

    // Descontar XP de apuesta al challenger
    await tx.update(players).set({
      xp: challenger.xp - xpStake,
    }).where(eq(players.id, challenger.id));

    await tx.insert(notifications).values({
      playerId:     challengedId,
      type:         "friend_request", // reutilizar tipo más cercano
      fromPlayerId: challenger.id,
      message:      `${challenger.displayName} te reta · ${xpStake} XP en juego`,
    });
  });

  revalidatePath("/challenges");
}

export async function acceptChallenge(challengeId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("Jugador no encontrado");

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!challenge || challenge.challengedId !== currentPlayer.id) {
    throw new Error("No autorizado");
  }

  await db.update(challenges)
    .set({ status: "accepted" })
    .where(eq(challenges.id, challengeId));
  revalidatePath("/challenges");
}

export async function rejectChallenge(challengeId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("Jugador no encontrado");

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!challenge || challenge.challengedId !== currentPlayer.id) {
    throw new Error("No autorizado");
  }

  const challenger = await db.query.players.findFirst({ where: eq(players.id, challenge.challengerId) });

  await db.transaction(async (tx) => {
    await tx.update(challenges).set({ status: "rejected" }).where(eq(challenges.id, challengeId));

    // Devolver XP apostado al challenger
    if (challenger) {
      await tx.update(players).set({
        xp: challenger.xp + challenge.xpStake,
      }).where(eq(players.id, challenge.challengerId));
    }
  });
  revalidatePath("/challenges");
}
