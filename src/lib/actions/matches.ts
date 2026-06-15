"use server";

import { db } from "@db/index";
import { matches, players, eloHistory } from "@db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateMatchElo } from "@lib/elo";
import { calculateXpGain, calculateLevel } from "@lib/xp";
import { calculateAttributeGrowth, getSetsForPlayer } from "@lib/attributes";
import { evaluateAndAwardAchievements } from "@lib/achievements";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";

const SetSchema = z.object({
  team1: z.number().min(0).max(7),
  team2: z.number().min(0).max(7),
}).refine((s) => s.team1 !== s.team2, { message: "Un set no puede terminar en empate" });

const CreateMatchSchema = z.object({
  venue:       z.string().min(2),
  playedAt:    z.string(),
  partnerId:   z.string().uuid(),
  opponent1Id: z.string().uuid(),
  opponent2Id: z.string().uuid(),
  sets:        z.array(SetSchema).min(1).max(3),
});

export type CreateMatchInput = z.infer<typeof CreateMatchSchema>;

function determineWinner(sets: Array<{ team1: number; team2: number }>): "team1" | "team2" {
  let t1 = 0, t2 = 0;
  for (const s of sets) {
    if (s.team1 > s.team2) t1++;
    else t2++;
  }
  return t1 > t2 ? "team1" : "team2";
}

function isComeback(sets: Array<{ team1: number; team2: number }>, isTeam1: boolean): boolean {
  if (sets.length < 3) return false;
  const first = sets[0];
  if (!first) return false;
  return isTeam1 ? first.team1 < first.team2 : first.team2 < first.team1;
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

  const uniqueIds = new Set([currentPlayer.id, partnerId, opponent1Id, opponent2Id]);
  if (uniqueIds.size !== 4) throw new Error("Los 4 jugadores del partido deben ser distintos");

  const winnerTeam = determineWinner(sets);
  const team1Won   = winnerTeam === "team1";

  // ELO
  const eloResult = calculateMatchElo(
    [currentPlayer.elo, partner.elo],
    [opp1.elo, opp2.elo],
    team1Won
  );

  // XP (mismo para los dos jugadores del mismo equipo)
  const opp1Avg  = Math.round((opp1.elo + opp2.elo) / 2);
  const team1Avg = Math.round((currentPlayer.elo + partner.elo) / 2);
  const team1Xp  = calculateXpGain(currentPlayer.elo, opp1Avg, team1Won);
  const team2Xp  = calculateXpGain(opp1.elo, team1Avg, !team1Won);

  // Niveles
  const p1Level = calculateLevel(currentPlayer.xp + team1Xp);
  const p2Level = calculateLevel(partner.xp + team1Xp);
  const p3Level = calculateLevel(opp1.xp + team2Xp);
  const p4Level = calculateLevel(opp2.xp + team2Xp);

  // Atributos dinámicos
  const p1Sets = getSetsForPlayer(sets, true);
  const p2Sets = getSetsForPlayer(sets, true);
  const p3Sets = getSetsForPlayer(sets, false);
  const p4Sets = getSetsForPlayer(sets, false);

  const p1Attrs = calculateAttributeGrowth(
    { attrAttack: currentPlayer.attrAttack, attrDefense: currentPlayer.attrDefense, attrVolley: currentPlayer.attrVolley, attrConsistency: currentPlayer.attrConsistency },
    team1Won, p1Sets.setsWon, p1Sets.setsLost, currentPlayer.totalWins + currentPlayer.totalLosses + 1
  );
  const p2Attrs = calculateAttributeGrowth(
    { attrAttack: partner.attrAttack, attrDefense: partner.attrDefense, attrVolley: partner.attrVolley, attrConsistency: partner.attrConsistency },
    team1Won, p2Sets.setsWon, p2Sets.setsLost, partner.totalWins + partner.totalLosses + 1
  );
  const p3Attrs = calculateAttributeGrowth(
    { attrAttack: opp1.attrAttack, attrDefense: opp1.attrDefense, attrVolley: opp1.attrVolley, attrConsistency: opp1.attrConsistency },
    !team1Won, p3Sets.setsWon, p3Sets.setsLost, opp1.totalWins + opp1.totalLosses + 1
  );
  const p4Attrs = calculateAttributeGrowth(
    { attrAttack: opp2.attrAttack, attrDefense: opp2.attrDefense, attrVolley: opp2.attrVolley, attrConsistency: opp2.attrConsistency },
    !team1Won, p4Sets.setsWon, p4Sets.setsLost, opp2.totalWins + opp2.totalLosses + 1
  );

  // Transacción
  const [insertedMatch] = await db.transaction(async (tx) => {
    const [match] = await tx.insert(matches).values({
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
      team1EloDelta:  eloResult.team1[0]!.delta,
      team2EloDelta:  eloResult.team2[0]!.delta,
      createdBy:      currentPlayer.id,
      seasonId:       currentPlayer.seasonId,
    }).returning();

    await tx.update(players).set({
      elo:             eloResult.team1[0]!.newElo,
      xp:              currentPlayer.xp + team1Xp,
      level:           p1Level.level,
      xpToNextLevel:   p1Level.xpToNextLevel,
      totalWins:       team1Won ? currentPlayer.totalWins + 1 : currentPlayer.totalWins,
      totalLosses:     team1Won ? currentPlayer.totalLosses : currentPlayer.totalLosses + 1,
      winStreak:       team1Won ? currentPlayer.winStreak + 1 : 0,
      ...p1Attrs,
      updatedAt:       new Date(),
    }).where(eq(players.id, currentPlayer.id));

    await tx.update(players).set({
      elo:             eloResult.team1[1]!.newElo,
      xp:              partner.xp + team1Xp,
      level:           p2Level.level,
      xpToNextLevel:   p2Level.xpToNextLevel,
      totalWins:       team1Won ? partner.totalWins + 1 : partner.totalWins,
      totalLosses:     team1Won ? partner.totalLosses : partner.totalLosses + 1,
      winStreak:       team1Won ? partner.winStreak + 1 : 0,
      ...p2Attrs,
      updatedAt:       new Date(),
    }).where(eq(players.id, partner.id));

    await tx.update(players).set({
      elo:             eloResult.team2[0]!.newElo,
      xp:              opp1.xp + team2Xp,
      level:           p3Level.level,
      xpToNextLevel:   p3Level.xpToNextLevel,
      totalWins:       !team1Won ? opp1.totalWins + 1 : opp1.totalWins,
      totalLosses:     !team1Won ? opp1.totalLosses : opp1.totalLosses + 1,
      winStreak:       !team1Won ? opp1.winStreak + 1 : 0,
      ...p3Attrs,
      updatedAt:       new Date(),
    }).where(eq(players.id, opp1.id));

    await tx.update(players).set({
      elo:             eloResult.team2[1]!.newElo,
      xp:              opp2.xp + team2Xp,
      level:           p4Level.level,
      xpToNextLevel:   p4Level.xpToNextLevel,
      totalWins:       !team1Won ? opp2.totalWins + 1 : opp2.totalWins,
      totalLosses:     !team1Won ? opp2.totalLosses : opp2.totalLosses + 1,
      winStreak:       !team1Won ? opp2.winStreak + 1 : 0,
      ...p4Attrs,
      updatedAt:       new Date(),
    }).where(eq(players.id, opp2.id));

    if (match) {
      await tx.insert(eloHistory).values([
        { playerId: currentPlayer.id, elo: eloResult.team1[0]!.newElo, delta: eloResult.team1[0]!.delta, matchId: match.id },
        { playerId: partner.id,       elo: eloResult.team1[1]!.newElo, delta: eloResult.team1[1]!.delta, matchId: match.id },
        { playerId: opp1.id,          elo: eloResult.team2[0]!.newElo, delta: eloResult.team2[0]!.delta, matchId: match.id },
        { playerId: opp2.id,          elo: eloResult.team2[1]!.newElo, delta: eloResult.team2[1]!.delta, matchId: match.id },
      ]);
    }

    return [match];
  });

  // Logros fuera de transacción
  const updatedPlayer = await db.query.players.findFirst({
    where: eq(players.id, currentPlayer.id),
  });

  if (updatedPlayer) {
    await evaluateAndAwardAchievements(
      {
        id:              updatedPlayer.id,
        totalWins:       updatedPlayer.totalWins,
        winStreak:       updatedPlayer.winStreak,
        level:           updatedPlayer.level,
        attrVolley:      updatedPlayer.attrVolley,
        attrConsistency: updatedPlayer.attrConsistency,
        seasonId:        updatedPlayer.seasonId,
      },
      isComeback(sets, true)
    );
  }

  revalidatePath("/");
  revalidatePath("/rankings");
  revalidatePath("/matches");
  revalidatePath("/profile");

  return {
    success:  true,
    xpGained: team1Xp,
    eloDelta: eloResult.team1[0]!.delta,
    oldLevel: currentPlayer.level,
    newLevel: p1Level.level,
    newElo:   eloResult.team1[0]!.newElo,
  };
}
