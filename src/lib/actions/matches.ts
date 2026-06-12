"use server";

import { db } from "@db/index";
import { matches, players, achievements } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateTeamElo } from "@lib/elo";
import { calculateXpGain, calculateLevel } from "@lib/xp";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";

const SetSchema = z.object({
  team1: z.number().min(0).max(7),
  team2: z.number().min(0).max(7),
});

const CreateMatchSchema = z.object({
  venue:       z.string().min(2),
  playedAt:    z.string(),
  partnerId:   z.string().uuid(),
  opponent1Id: z.string().uuid(),
  opponent2Id: z.string().uuid(),
  sets:        z.array(SetSchema).min(1).max(3),
});

export type CreateMatchInput = z.infer<typeof CreateMatchSchema>;

function determineWinner(sets: Array<{ team1: number; team2: number }>) {
  let team1Wins = 0;
  let team2Wins = 0;
  for (const set of sets) {
    if (set.team1 > set.team2) team1Wins++;
    else team2Wins++;
  }
  return team1Wins > team2Wins ? "team1" : "team2";
}

async function checkAndAwardAchievements(
  playerId: string,
  wins: number,
  streak: number,
  totalMatches: number,
  level: number,
  isComeback: boolean,
  seasonId: string | null | undefined,
  topPlayerIds: Set<string>
) {
  const toAward: (typeof achievements.$inferInsert["type"])[] = [];
  if (wins === 1) toAward.push("first_win");
  if (streak >= 3) toAward.push("win_streak_3");
  if (streak >= 5) toAward.push("win_streak_5");
  if (streak >= 10) toAward.push("win_streak_10");
  if (totalMatches >= 100) toAward.push("century_matches");
  if (isComeback) toAward.push("comeback_win");
  if (level >= 10) toAward.push("level_10");
  if (level >= 25) toAward.push("level_25");
  if (topPlayerIds.has(playerId)) {
    toAward.push("top_3_ranking");
  }

  for (const type of toAward) {
    try {
      await db.insert(achievements).values({
        playerId,
        type,
        seasonId: seasonId ?? undefined,
      }).onConflictDoNothing();
    } catch {}
  }
}

export async function createMatch(input: CreateMatchInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = CreateMatchSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const { venue, playedAt, partnerId, opponent1Id, opponent2Id, sets } = parsed.data;
  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("Jugador no encontrado");

  const [partner, opp1, opp2] = await Promise.all([
    db.query.players.findFirst({ where: eq(players.id, partnerId) }),
    db.query.players.findFirst({ where: eq(players.id, opponent1Id) }),
    db.query.players.findFirst({ where: eq(players.id, opponent2Id) }),
  ]);

  if (!partner || !opp1 || !opp2) throw new Error("Jugadores no encontrados");

  const winnerTeam = determineWinner(sets);
  const team1Won   = winnerTeam === "team1";

  // Detectar remontada (perder primer set y ganar partido)
  const isTeam1Comeback = team1Won && sets[0]!.team1 < sets[0]!.team2;
  const isTeam2Comeback = !team1Won && sets[0]!.team2 < sets[0]!.team1;

  const { team1Deltas, team2Deltas } = calculateTeamElo(
    [currentPlayer.elo, partner.elo],
    [opp1.elo, opp2.elo],
    team1Won
  );

  const opp1Avg = Math.round((opp1.elo + opp2.elo) / 2);
  const team1Xp = calculateXpGain(currentPlayer.elo, opp1Avg, team1Won);
  const team2Xp = calculateXpGain(opp1.elo, Math.round((currentPlayer.elo + partner.elo) / 2), !team1Won);

  // Calcular nuevos niveles
  const p1Level  = calculateLevel(currentPlayer.xp + team1Xp);
  const p2Level  = calculateLevel(partner.xp + team1Xp);
  const p3Level  = calculateLevel(opp1.xp + team2Xp);
  const p4Level  = calculateLevel(opp2.xp + team2Xp);

  // Mejora de atributos (pequeña probabilidad o incremento fijo)
  const incAttr = (val: number) => Math.max(0, Math.min(100, val + (Math.random() > 0.7 ? 1 : 0)));

  await db.transaction(async (tx) => {
    // Insertar partido
    await tx.insert(matches).values({
      venue,
      playedAt:       new Date(playedAt),
      team1Player1Id: currentPlayer.id,
      team1Player2Id: partnerId,
      team2Player1Id: opponent1Id,
      team2Player2Id: opponent2Id,
      winnerTeam,
      sets,
      team1XpGained:  team1Xp,
      team2XpGained:  team2Xp,
      team1EloDelta:  team1Deltas[0],
      team2EloDelta:  team2Deltas[0],
      createdBy:      currentPlayer.id,
      seasonId:       currentPlayer.seasonId,
    });

    // Actualizar jugador 1 (current)
    await tx.update(players).set({
      elo:           currentPlayer.elo + team1Deltas[0],
      xp:            currentPlayer.xp + team1Xp,
      level:         p1Level.level,
      xpToNextLevel: p1Level.xpToNextLevel,
      totalWins:     team1Won ? currentPlayer.totalWins + 1 : currentPlayer.totalWins,
      totalLosses:   team1Won ? currentPlayer.totalLosses : currentPlayer.totalLosses + 1,
      winStreak:     team1Won ? currentPlayer.winStreak + 1 : 0,
      attrAttack:    incAttr(currentPlayer.attrAttack),
      attrDefense:   incAttr(currentPlayer.attrDefense),
      attrVolley:    incAttr(currentPlayer.attrVolley),
      attrConsistency: incAttr(currentPlayer.attrConsistency),
      updatedAt:     new Date(),
    }).where(eq(players.id, currentPlayer.id));

    // Actualizar jugador 2 (partner)
    await tx.update(players).set({
      elo:           partner.elo + team1Deltas[1],
      xp:            partner.xp + team1Xp,
      level:         p2Level.level,
      xpToNextLevel: p2Level.xpToNextLevel,
      totalWins:     team1Won ? partner.totalWins + 1 : partner.totalWins,
      totalLosses:   team1Won ? partner.totalLosses : partner.totalLosses + 1,
      winStreak:     team1Won ? partner.winStreak + 1 : 0,
      attrAttack:    incAttr(partner.attrAttack),
      attrDefense:   incAttr(partner.attrDefense),
      attrVolley:    incAttr(partner.attrVolley),
      attrConsistency: incAttr(partner.attrConsistency),
      updatedAt:     new Date(),
    }).where(eq(players.id, partner.id));

    // Actualizar oponente 1
    await tx.update(players).set({
      elo:           opp1.elo + team2Deltas[0],
      xp:            opp1.xp + team2Xp,
      level:         p3Level.level,
      xpToNextLevel: p3Level.xpToNextLevel,
      totalWins:     !team1Won ? opp1.totalWins + 1 : opp1.totalWins,
      totalLosses:   !team1Won ? opp1.totalLosses : opp1.totalLosses + 1,
      winStreak:     !team1Won ? opp1.winStreak + 1 : 0,
      attrAttack:    incAttr(opp1.attrAttack),
      attrDefense:   incAttr(opp1.attrDefense),
      attrVolley:    incAttr(opp1.attrVolley),
      attrConsistency: incAttr(opp1.attrConsistency),
      updatedAt:     new Date(),
    }).where(eq(players.id, opp1.id));

    // Actualizar oponente 2
    await tx.update(players).set({
      elo:           opp2.elo + team2Deltas[1],
      xp:            opp2.xp + team2Xp,
      level:         p4Level.level,
      xpToNextLevel: p4Level.xpToNextLevel,
      totalWins:     !team1Won ? opp2.totalWins + 1 : opp2.totalWins,
      totalLosses:   !team1Won ? opp2.totalLosses : opp2.totalLosses + 1,
      winStreak:     !team1Won ? opp2.winStreak + 1 : 0,
      attrAttack:    incAttr(opp2.attrAttack),
      attrDefense:   incAttr(opp2.attrDefense),
      attrVolley:    incAttr(opp2.attrVolley),
      attrConsistency: incAttr(opp2.attrConsistency),
      updatedAt:     new Date(),
    }).where(eq(players.id, opp2.id));
  });

  // Logros fuera de la transacción (para todos los jugadores)
  const playerIds = [currentPlayer.id, partnerId, opponent1Id, opponent2Id];
  const updatedPlayers = await db.query.players.findMany({
    where: (p, { inArray }) => inArray(p.id, playerIds),
  });

  // Buscar top 3 una sola vez
  const topPlayers = await db.query.players.findMany({
    orderBy: [desc(players.elo)],
    limit: 3,
  });
  const topPlayerIds = new Set(topPlayers.map(p => p.id));

  for (const p of updatedPlayers) {
    const isWinner = (p.id === currentPlayer.id || p.id === partnerId) ? team1Won : !team1Won;
    const comeback = isWinner && ((p.id === currentPlayer.id || p.id === partnerId) ? isTeam1Comeback : isTeam2Comeback);

    await checkAndAwardAchievements(
      p.id,
      p.totalWins,
      p.winStreak,
      p.totalWins + p.totalLosses,
      p.level,
      comeback,
      p.seasonId,
      topPlayerIds
    );

    // Logros de atributos
    if (p.attrVolley >= 90) {
      await db.insert(achievements).values({ playerId: p.id, type: "volley_master", seasonId: p.seasonId ?? undefined }).onConflictDoNothing();
    }
    if (p.attrConsistency >= 90) {
      await db.insert(achievements).values({ playerId: p.id, type: "consistent_player", seasonId: p.seasonId ?? undefined }).onConflictDoNothing();
    }
  }

  revalidatePath("/");
  revalidatePath("/rankings");
  revalidatePath("/matches");
  revalidatePath("/profile");

  return {
    success:   true,
    xpGained:  team1Xp,
    eloDelta:  team1Deltas[0],
    oldLevel:  currentPlayer.level,
    newLevel:  p1Level.level,
  };
}
