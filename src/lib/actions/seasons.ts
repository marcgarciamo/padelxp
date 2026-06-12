"use server";

import { db } from "@db/index";
import { seasons, players } from "@db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@lib/auth";
import { headers } from "next/headers";

export async function createSeason(name: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");
  // En un sistema real, aquí verificaríamos si el usuario es ADMIN

  await db.transaction(async (tx) => {
    // Desactivar temporada actual
    await tx.update(seasons)
      .set({ isActive: false, endDate: new Date() })
      .where(eq(seasons.isActive, true));

    // Crear nueva temporada
    const [newSeason] = await tx.insert(seasons).values({
      name,
      startDate: new Date(),
      isActive:  true,
    }).returning();

    if (!newSeason) throw new Error("Error al crear la temporada");

    // Reset parcial de ELO y vincular jugadores a la nueva temporada
    const allPlayers = await tx.query.players.findMany();
    for (const p of allPlayers) {
      const newElo = Math.round((p.elo - 1500) * 0.5 + 1500);
      await tx.update(players).set({
        elo:       newElo,
        winStreak: 0,
        seasonId:  newSeason.id,
        updatedAt: new Date(),
      }).where(eq(players.id, p.id));
    }
  });

  revalidatePath("/");
  revalidatePath("/rankings");
  return { success: true };
}

export async function getActiveSeason() {
  return db.query.seasons.findFirst({
    where: eq(seasons.isActive, true),
  });
}
