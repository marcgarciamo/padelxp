"use server";

import { db } from "@db/index";
import { seasons, players, seasonSnapshots, adminActivityLog, notifications } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";
import { calculateGlobalRating } from "@lib/attributes";
import { z } from "zod";
import { generateSlug } from "@lib/slug";

const CreateSeasonSchema = z.object({
  name:      z.string().min(3),
  slug:      z.string().min(2).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  startsAt:  z.string(),
  endsAt:    z.string().optional(),
  notes:     z.string().optional(),
});

export async function createSeasonAction(input: z.infer<typeof CreateSeasonSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const admin = await getPlayerByUserId(session.user.id);
  if (!admin || !["admin", "moderator"].includes(admin.role)) throw new Error("No autorizado");

  const parsed = CreateSeasonSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const { name, slug, startsAt, endsAt, notes } = parsed.data;

  const [season] = await db.insert(seasons).values({
    name,
    slug,
    status:    "upcoming",
    startDate: new Date(startsAt),
    endDate:   endsAt ? new Date(endsAt) : undefined,
    isActive:  false,
    createdBy: admin.id,
    meta:      notes ? { notes } : {},
  }).returning();

  await db.insert(adminActivityLog).values({
    adminId:    admin.id,
    action:     "season_created",
    targetType: "season",
    targetId:   season!.id,
    metadata:   { name },
  });

  revalidatePath("/admin/seasons");
  return season!;
}

export async function updateSeasonAction(seasonId: string, input: Partial<z.infer<typeof CreateSeasonSchema>>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const admin = await getPlayerByUserId(session.user.id);
  if (!admin || !["admin", "moderator"].includes(admin.role)) throw new Error("No autorizado");

  await db.update(seasons).set({
    ...(input.name     ? { name: input.name }                         : {}),
    ...(input.slug     ? { slug: input.slug }                         : {}),
    ...(input.startsAt ? { startDate: new Date(input.startsAt) }      : {}),
    ...(input.endsAt   ? { endDate: new Date(input.endsAt) }          : {}),
    ...(input.notes    ? { meta: { notes: input.notes } }             : {}),
  }).where(eq(seasons.id, seasonId));

  await db.insert(adminActivityLog).values({
    adminId:    admin.id,
    action:     "season_updated",
    targetType: "season",
    targetId:   seasonId,
  });

  revalidatePath("/admin/seasons");
}

export async function activateSeasonAction(seasonId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const admin = await getPlayerByUserId(session.user.id);
  if (!admin || admin.role !== "admin") throw new Error("Solo admins pueden activar temporadas");

  const season = await db.query.seasons.findFirst({
    where: eq(seasons.id, seasonId),
  });
  if (!season) throw new Error("Temporada no encontrada");
  if (season.status !== "upcoming") throw new Error("Solo se pueden activar temporadas en estado 'upcoming'");

  const activeSeason = await db.query.seasons.findFirst({
    where: eq(seasons.status, "active"),
  });
  if (activeSeason) throw new Error("Ya hay una temporada activa. Ciérrala primero.");

  await db.transaction(async (tx) => {
    await tx.update(seasons).set({
      status:   "active",
      isActive: true,
    }).where(eq(seasons.id, seasonId));

    await tx.insert(adminActivityLog).values({
      adminId:    admin.id,
      action:     "season_activated",
      targetType: "season",
      targetId:   seasonId,
      metadata:   { name: season.name },
    });
  });

  revalidatePath("/admin/seasons");
}

export async function closeSeasonAction(seasonId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const admin = await getPlayerByUserId(session.user.id);
  if (!admin || admin.role !== "admin") throw new Error("Solo admins pueden cerrar temporadas");

  await db.transaction(async (tx) => {
    const season = await tx.query.seasons.findFirst({
      where: and(eq(seasons.id, seasonId), eq(seasons.status, "active")),
    });
    if (!season) throw new Error("Temporada no encontrada o no está activa");

    const affectedPlayers = await tx.query.players.findMany({
      where: eq(players.seasonId, seasonId),
    });

    const sorted = [...affectedPlayers].sort((a, b) => b.elo - a.elo);

    if (sorted.length > 0) {
      await tx.insert(seasonSnapshots).values(
        sorted.map((p, index) => ({
          seasonId,
          playerId:         p.id,
          finalElo:         p.elo,
          finalMediaGlobal: String(calculateGlobalRating({
            attrAttack:      p.attrAttack,
            attrDefense:     p.attrDefense,
            attrVolley:      p.attrVolley,
            attrConsistency: p.attrConsistency,
            attrBandeja:     p.attrBandeja,
            attrRemate:      p.attrRemate,
          })),
          finalXp:      p.xp,
          finalLevel:   p.level,
          totalWins:    p.totalWins,
          totalLosses:  p.totalLosses,
          mvpCount:     p.mvpCount,
          rankPosition: index + 1,
        }))
      );

      await tx.update(players).set({
        elo:        1200,
        totalWins:  0,
        totalLosses: 0,
        winStreak:  0,
        mvpCount:   0,
        seasonId:   null,
        updatedAt:  new Date(),
      }).where(eq(players.seasonId, seasonId));

      await tx.insert(notifications).values(
        affectedPlayers.map((p) => ({
          playerId:  p.id,
          type:      "season_ended" as const,
          message:   `La temporada "${season.name}" ha finalizado. ¡Comprueba tu posición final!`,
          flowId:    seasonId,
        }))
      );
    }

    await tx.update(seasons).set({
      status:   "closed",
      isActive: false,
      closedAt: new Date(),
    }).where(eq(seasons.id, seasonId));

    await tx.insert(adminActivityLog).values({
      adminId:    admin.id,
      action:     "season_closed",
      targetType: "season",
      targetId:   seasonId,
      metadata:   { name: season.name, playersAffected: affectedPlayers.length },
    });
  });

  revalidatePath("/admin/seasons");
  revalidatePath("/");
}

export async function deleteSeasonAction(seasonId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const admin = await getPlayerByUserId(session.user.id);
  if (!admin || admin.role !== "admin") throw new Error("Solo admins pueden eliminar temporadas");

  const season = await db.query.seasons.findFirst({ where: eq(seasons.id, seasonId) });
  if (!season) throw new Error("Temporada no encontrada");
  if (season.status === "active") throw new Error("No se puede eliminar una temporada activa");

  await db.delete(seasons).where(eq(seasons.id, seasonId));

  await db.insert(adminActivityLog).values({
    adminId:    admin.id,
    action:     "season_deleted",
    targetType: "season",
    targetId:   seasonId,
    metadata:   { name: season.name },
  });

  revalidatePath("/admin/seasons");
}

export async function getActiveSeason() {
  return db.query.seasons.findFirst({
    where: eq(seasons.status, "active"),
  });
}

