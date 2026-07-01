"use server";

import { db } from "@db/index";
import {
  postmatchFlows, postmatchValidations, postmatchCompletions,
  prestigeVotes, mvpVotes, players, notifications,
  leagueMatches, leagueTeams, leagueRounds, leagues,
  matches, eloHistory, seasons,
} from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import { calculateMatchElo, getScoreMultiplier } from "@lib/elo";
import { calculateXpGain, calculateLevel } from "@lib/xp";
import { calculateAttributeGrowth, calculateGlobalRating, getSetsForPlayer, applyPrestigePoints } from "@lib/attributes";
import { evaluateAndAwardAchievements } from "@lib/achievements";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";

// ── Paso 1: Validar el resultado ──────────────────────────────────────────

const ValidationSchema = z.object({
  flowId:    z.string().uuid(),
  confirms:  z.boolean(),
  altSets:   z.array(z.object({ team1: z.number(), team2: z.number() })).optional(),
  altWinner: z.enum(["team1", "team2"]).optional(),
});

export async function validateResult(
  input: z.infer<typeof ValidationSchema>,
): Promise<{ error?: string; validationsCount?: number }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "No autenticado" };

    const parsed = ValidationSchema.safeParse(input);
    if (!parsed.success) return { error: "Datos inválidos" };

    const player = await getPlayerByUserId(session.user.id);
    if (!player) return { error: "Jugador no encontrado" };

    const flow = await db.query.postmatchFlows.findFirst({
      where: eq(postmatchFlows.id, parsed.data.flowId),
      with:  { completions: true, validations: true },
    });

    if (!flow) return { error: "Flujo no encontrado" };
    if (new Date() > flow.expiresAt) return { error: "El tiempo de validación ha expirado" };
    if (flow.status === "completed") return { error: "Este partido ya está completado" };

    const myCompletion = flow.completions.find((c) => c.playerId === player.id);
    if (!myCompletion) return { error: "No participas en este partido" };
    if (myCompletion.validated) return { error: "Ya has validado este resultado" };

    await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(postmatchValidations).values({
        flowId:    flow.id,
        playerId:  player.id,
        confirms:  parsed.data.confirms,
        altSets:   parsed.data.altSets,
        altWinner: parsed.data.altWinner,
      }).onConflictDoNothing().returning({ id: postmatchValidations.id });

      if (!inserted) return;

      await tx.update(postmatchCompletions).set({
        validated: true,
      }).where(and(
        eq(postmatchCompletions.flowId, flow.id),
        eq(postmatchCompletions.playerId, player.id)
      ));

      await tx.update(postmatchFlows).set({
        validationsCount: sql`${postmatchFlows.validationsCount} + 1`,
        status: sql`CASE WHEN ${postmatchFlows.validationsCount} + 1 >= 4 THEN 'pending_voting' ELSE 'pending_validation' END`,
      }).where(eq(postmatchFlows.id, flow.id));
    });

    const updated = await db.query.postmatchFlows.findFirst({
      where: eq(postmatchFlows.id, flow.id),
    });

    revalidatePath("/postmatch/" + flow.id);
    return { validationsCount: updated?.validationsCount ?? flow.validationsCount + 1 };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error inesperado al validar" };
  }
}

// ── Paso 3: Votar MVP ─────────────────────────────────────────────────────

export async function submitMvpVote(
  flowId:    string,
  nomineeId: string | null,
): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "No autenticado" };

    const player = await getPlayerByUserId(session.user.id);
    if (!player) return { error: "Jugador no encontrado" };

    const flow = await db.query.postmatchFlows.findFirst({
      where: eq(postmatchFlows.id, flowId),
      with:  { completions: true },
    });

    if (!flow) return { error: "Flujo no encontrado" };
    if (flow.status !== "pending_voting") return { error: "Aún no es el momento de votar" };
    if (new Date() > flow.expiresAt)      return { error: "El tiempo de validación ha expirado" };
    if (nomineeId && nomineeId === player.id) return { error: "No puedes votarte a ti mismo" };

    const myCompletion = flow.completions.find((c) => c.playerId === player.id);
    if (!myCompletion)       return { error: "No participas en este partido" };
    if (myCompletion.mvpVoted) return { error: "Ya has votado el MVP" };

    const allParticipantIds = flow.completions.map((c) => c.playerId);
    if (nomineeId && !allParticipantIds.includes(nomineeId)) {
      return { error: "El jugador seleccionado no participa en este partido" };
    }

    await db.transaction(async (tx) => {
      if (nomineeId) {
        await tx.insert(mvpVotes).values({
          matchId:   flow.matchId,
          matchType: flow.matchType,
          voterId:   player.id,
          nomineeId,
          confirmed: false,
          expiresAt: flow.expiresAt,
        }).onConflictDoNothing();
      }

      await tx.update(postmatchCompletions).set({
        mvpVoted: true,
      }).where(and(
        eq(postmatchCompletions.flowId, flow.id),
        eq(postmatchCompletions.playerId, player.id)
      ));
    });

    revalidatePath("/postmatch/" + flowId);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error inesperado al votar MVP" };
  }
}

// ── Paso 4: Repartir Puntos de Prestigio ─────────────────────────────────

const PrestigeSchema = z.object({
  flowId: z.string().uuid(),
  votes:  z.array(z.object({
    targetId:   z.string().uuid(),
    ptsAttack:  z.number().min(0).max(3),
    ptsDefense: z.number().min(0).max(3),
    ptsVolley:  z.number().min(0).max(3),
    ptsBandeja: z.number().min(0).max(3),
    ptsRemate:  z.number().min(0).max(3),
  })).length(2),
});

export async function submitPrestigeVotes(
  input: z.infer<typeof PrestigeSchema>,
): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "No autenticado" };

    const parsed = PrestigeSchema.safeParse(input);
    if (!parsed.success) return { error: "Datos inválidos" };

    const player = await getPlayerByUserId(session.user.id);
    if (!player) return { error: "Jugador no encontrado" };

    for (const vote of parsed.data.votes) {
      const total = vote.ptsAttack + vote.ptsDefense + vote.ptsVolley + vote.ptsBandeja + vote.ptsRemate;
      if (total !== 3) return { error: `Debes repartir exactamente 3 puntos por jugador (actual: ${total})` };
    }

    const flow = await db.query.postmatchFlows.findFirst({
      where: eq(postmatchFlows.id, parsed.data.flowId),
      with:  { completions: true },
    });

    if (!flow) return { error: "Flujo no encontrado" };
    if (new Date() > flow.expiresAt) return { error: "El tiempo de validación ha expirado" };
    if (flow.status === "completed") return { error: "Este partido ya está completado" };

    const myCompletion = flow.completions.find((c) => c.playerId === player.id);
    if (!myCompletion) return { error: "No participas en este partido" };
    if (myCompletion.prestigeDone) return { error: "Ya has repartido los puntos de prestigio" };

    await db.transaction(async (tx) => {
      for (const vote of parsed.data.votes) {
        await tx.insert(prestigeVotes).values({
          flowId:    flow.id,
          voterId:   player.id,
          targetId:  vote.targetId,
          ptsAttack:  vote.ptsAttack,
          ptsDefense: vote.ptsDefense,
          ptsVolley:  vote.ptsVolley,
          ptsBandeja: vote.ptsBandeja,
          ptsRemate:  vote.ptsRemate,
        }).onConflictDoNothing();
      }

      const now = new Date();
      await tx.update(postmatchCompletions).set({
        prestigeDone: true,
        completedAt:  now,
      }).where(and(
        eq(postmatchCompletions.flowId, flow.id),
        eq(postmatchCompletions.playerId, player.id)
      ));

      const allCompletions = await tx.query.postmatchCompletions.findMany({
        where: eq(postmatchCompletions.flowId, flow.id),
      });

      const allDone = allCompletions.every(
        (c) => c.validated && c.mvpVoted && c.prestigeDone
      );

      if (allDone) {
        await tx.update(postmatchFlows).set({
          status:      "completed",
          completedAt: now,
        }).where(eq(postmatchFlows.id, flow.id));
      }
    });

    const updatedFlow = await db.query.postmatchFlows.findFirst({
      where: eq(postmatchFlows.id, parsed.data.flowId),
    });

    if (updatedFlow?.status === "completed") {
      await processCompletedFlow(parsed.data.flowId);
    }

    revalidatePath("/postmatch/" + parsed.data.flowId);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error inesperado al enviar prestigio" };
  }
}

// ── Procesar flujo completado ─────────────────────────────────────────────

export async function processCompletedFlow(flowId: string) {
  const flow = await db.query.postmatchFlows.findFirst({
    where: eq(postmatchFlows.id, flowId),
    with: {
      validations: true,
      prestiges:   true,
    },
  });

  if (!flow || !flow.proposedSets || !flow.proposedWinner) return;

  const confirmations = flow.validations.filter((v) => v.confirms).length;
  const useFinal      = confirmations >= 2;
  const finalSets     = useFinal ? flow.proposedSets : (flow.validations.find((v) => !v.confirms)?.altSets ?? flow.proposedSets);
  const finalWinner   = useFinal ? flow.proposedWinner : (flow.validations.find((v) => !v.confirms)?.altWinner ?? flow.proposedWinner);

  const activeSeason = await db.query.seasons.findFirst({ where: eq(seasons.status, "active") });
  const activeSeasonId = activeSeason?.id ?? null;

  if (flow.matchType === "league") {
    const match = await db.query.leagueMatches.findFirst({
      where: eq(leagueMatches.id, flow.matchId),
      with: {
        team1:  { with: { player1: true, player2: true } },
        team2:  { with: { player1: true, player2: true } },
        league: true,
      },
    });
    if (!match?.team1?.player1 || !match?.team1?.player2 ||
        !match?.team2?.player1 || !match?.team2?.player2) return;

    await db.update(leagueMatches).set({
      sets:     finalSets,
      winnerId: finalWinner === "team1" ? match.team1Id : match.team2Id,
      playedAt: new Date(),
    }).where(eq(leagueMatches.id, flow.matchId));

    const winnerId = finalWinner === "team1" ? match.team1Id : match.team2Id;
    const loserId  = finalWinner === "team1" ? match.team2Id : match.team1Id;

    let winningSets = 0, losingSets = 0;
    for (const s of finalSets) {
      const wGames = finalWinner === "team1" ? s.team1 : s.team2;
      const lGames = finalWinner === "team1" ? s.team2 : s.team1;
      if (wGames > lGames) winningSets++; else losingSets++;
    }

    const [winnerTeam, loserTeam] = await Promise.all([
      db.query.leagueTeams.findFirst({ where: eq(leagueTeams.id, winnerId) }),
      db.query.leagueTeams.findFirst({ where: eq(leagueTeams.id, loserId) }),
    ]);

    const pointsWin = match.league?.pointsWin ?? 3;
    await db.update(leagueTeams).set({
      points:   sql`${leagueTeams.points} + ${pointsWin}`,
      wins:     sql`${leagueTeams.wins} + 1`,
      setsWon:  sql`${leagueTeams.setsWon} + ${winningSets}`,
      setsLost: sql`${leagueTeams.setsLost} + ${losingSets}`,
    }).where(eq(leagueTeams.id, winnerId));

    await db.update(leagueTeams).set({
      losses:   sql`${leagueTeams.losses} + 1`,
      setsWon:  sql`${leagueTeams.setsWon} + ${losingSets}`,
      setsLost: sql`${leagueTeams.setsLost} + ${winningSets}`,
    }).where(eq(leagueTeams.id, loserId));

    // Comprobar ronda completada
    const roundMatches = await db.query.leagueMatches.findMany({
      where: eq(leagueMatches.roundId, match.roundId),
    });
    const roundDone = roundMatches.every((m) => m.winnerId !== null || m.id === flow.matchId);
    if (roundDone) {
      await db.update(leagueRounds).set({ completed: true })
        .where(eq(leagueRounds.id, match.roundId));
    }

    // Comprobar liga completada
    const allRounds = await db.query.leagueRounds.findMany({
      where: eq(leagueRounds.leagueId, match.leagueId),
    });
    const leagueDone = allRounds.every((r) => r.completed || (r.id === match.roundId && roundDone));
    if (leagueDone) {
      await db.update(leagues).set({ status: "finished" })
        .where(eq(leagues.id, match.leagueId));
    }

    // ELO/XP/attrs individuales para partidos de liga
    const lp1 = match.team1.player1;
    const lp2 = match.team1.player2;
    const lp3 = match.team2.player1;
    const lp4 = match.team2.player2;

    const leagueScoreMult = getScoreMultiplier(finalSets);
    const leagueElo = calculateMatchElo(
      [lp1.elo, lp2.elo],
      [lp3.elo, lp4.elo],
      finalWinner === "team1",
      leagueScoreMult
    );

    const lp1Global = calculateGlobalRating({ attrAttack: lp1.attrAttack, attrDefense: lp1.attrDefense, attrVolley: lp1.attrVolley, attrConsistency: lp1.attrConsistency, attrBandeja: lp1.attrBandeja, attrRemate: lp1.attrRemate });
    const lp2Global = calculateGlobalRating({ attrAttack: lp2.attrAttack, attrDefense: lp2.attrDefense, attrVolley: lp2.attrVolley, attrConsistency: lp2.attrConsistency, attrBandeja: lp2.attrBandeja, attrRemate: lp2.attrRemate });
    const lp3Global = calculateGlobalRating({ attrAttack: lp3.attrAttack, attrDefense: lp3.attrDefense, attrVolley: lp3.attrVolley, attrConsistency: lp3.attrConsistency, attrBandeja: lp3.attrBandeja, attrRemate: lp3.attrRemate });
    const lp4Global = calculateGlobalRating({ attrAttack: lp4.attrAttack, attrDefense: lp4.attrDefense, attrVolley: lp4.attrVolley, attrConsistency: lp4.attrConsistency, attrBandeja: lp4.attrBandeja, attrRemate: lp4.attrRemate });

    const leagueTeam1Won = finalWinner === "team1";
    const lOppAvg    = Math.round((lp3Global + lp4Global) / 2);
    const lTeam1AvgG = Math.round((lp1Global + lp2Global) / 2);
    const lTeam1Xp   = calculateXpGain(lp1Global, lOppAvg, leagueTeam1Won);
    const lTeam2Xp   = calculateXpGain(lp3Global, lTeam1AvgG, !leagueTeam1Won);

    const lp1Level = calculateLevel(lp1.xp + lTeam1Xp);
    const lp2Level = calculateLevel(lp2.xp + lTeam1Xp);
    const lp3Level = calculateLevel(lp3.xp + lTeam2Xp);
    const lp4Level = calculateLevel(lp4.xp + lTeam2Xp);

    const lp1Sets = getSetsForPlayer(finalSets, true);
    const lp3Sets = getSetsForPlayer(finalSets, false);

    const lp1Attrs = calculateAttributeGrowth(
      { attrAttack: lp1.attrAttack, attrDefense: lp1.attrDefense, attrVolley: lp1.attrVolley, attrConsistency: lp1.attrConsistency, attrBandeja: lp1.attrBandeja, attrRemate: lp1.attrRemate },
      leagueElo.team1[0]!.newElo, leagueTeam1Won, lp1Sets.setsWon, lp1Sets.setsLost, lp1.totalWins + lp1.totalLosses + 1
    );
    const lp2Attrs = calculateAttributeGrowth(
      { attrAttack: lp2.attrAttack, attrDefense: lp2.attrDefense, attrVolley: lp2.attrVolley, attrConsistency: lp2.attrConsistency, attrBandeja: lp2.attrBandeja, attrRemate: lp2.attrRemate },
      leagueElo.team1[1]!.newElo, leagueTeam1Won, lp1Sets.setsWon, lp1Sets.setsLost, lp2.totalWins + lp2.totalLosses + 1
    );
    const lp3Attrs = calculateAttributeGrowth(
      { attrAttack: lp3.attrAttack, attrDefense: lp3.attrDefense, attrVolley: lp3.attrVolley, attrConsistency: lp3.attrConsistency, attrBandeja: lp3.attrBandeja, attrRemate: lp3.attrRemate },
      leagueElo.team2[0]!.newElo, !leagueTeam1Won, lp3Sets.setsWon, lp3Sets.setsLost, lp3.totalWins + lp3.totalLosses + 1
    );
    const lp4Attrs = calculateAttributeGrowth(
      { attrAttack: lp4.attrAttack, attrDefense: lp4.attrDefense, attrVolley: lp4.attrVolley, attrConsistency: lp4.attrConsistency, attrBandeja: lp4.attrBandeja, attrRemate: lp4.attrRemate },
      leagueElo.team2[1]!.newElo, !leagueTeam1Won, lp3Sets.setsWon, lp3Sets.setsLost, lp4.totalWins + lp4.totalLosses + 1
    );

    await db.transaction(async (tx) => {
      await tx.update(players).set({
        elo:           leagueElo.team1[0]!.newElo,
        xp:            sql`${players.xp} + ${lTeam1Xp}`,
        level:         lp1Level.level,
        xpToNextLevel: lp1Level.xpToNextLevel,
        totalWins:     leagueTeam1Won ? sql`${players.totalWins} + 1` : sql`${players.totalWins}`,
        totalLosses:   leagueTeam1Won ? sql`${players.totalLosses}` : sql`${players.totalLosses} + 1`,
        winStreak:     leagueTeam1Won ? sql`${players.winStreak} + 1` : 0,
        ...lp1Attrs, updatedAt: new Date(),
      }).where(eq(players.id, lp1.id));

      await tx.update(players).set({
        elo:           leagueElo.team1[1]!.newElo,
        xp:            sql`${players.xp} + ${lTeam1Xp}`,
        level:         lp2Level.level,
        xpToNextLevel: lp2Level.xpToNextLevel,
        totalWins:     leagueTeam1Won ? sql`${players.totalWins} + 1` : sql`${players.totalWins}`,
        totalLosses:   leagueTeam1Won ? sql`${players.totalLosses}` : sql`${players.totalLosses} + 1`,
        winStreak:     leagueTeam1Won ? sql`${players.winStreak} + 1` : 0,
        ...lp2Attrs, updatedAt: new Date(),
      }).where(eq(players.id, lp2.id));

      await tx.update(players).set({
        elo:           leagueElo.team2[0]!.newElo,
        xp:            sql`${players.xp} + ${lTeam2Xp}`,
        level:         lp3Level.level,
        xpToNextLevel: lp3Level.xpToNextLevel,
        totalWins:     !leagueTeam1Won ? sql`${players.totalWins} + 1` : sql`${players.totalWins}`,
        totalLosses:   !leagueTeam1Won ? sql`${players.totalLosses}` : sql`${players.totalLosses} + 1`,
        winStreak:     !leagueTeam1Won ? sql`${players.winStreak} + 1` : 0,
        ...lp3Attrs, updatedAt: new Date(),
      }).where(eq(players.id, lp3.id));

      await tx.update(players).set({
        elo:           leagueElo.team2[1]!.newElo,
        xp:            sql`${players.xp} + ${lTeam2Xp}`,
        level:         lp4Level.level,
        xpToNextLevel: lp4Level.xpToNextLevel,
        totalWins:     !leagueTeam1Won ? sql`${players.totalWins} + 1` : sql`${players.totalWins}`,
        totalLosses:   !leagueTeam1Won ? sql`${players.totalLosses}` : sql`${players.totalLosses} + 1`,
        winStreak:     !leagueTeam1Won ? sql`${players.winStreak} + 1` : 0,
        ...lp4Attrs, updatedAt: new Date(),
      }).where(eq(players.id, lp4.id));

      await tx.insert(eloHistory).values([
        { playerId: lp1.id, elo: leagueElo.team1[0]!.newElo, delta: leagueElo.team1[0]!.delta },
        { playerId: lp2.id, elo: leagueElo.team1[1]!.newElo, delta: leagueElo.team1[1]!.delta },
        { playerId: lp3.id, elo: leagueElo.team2[0]!.newElo, delta: leagueElo.team2[0]!.delta },
        { playerId: lp4.id, elo: leagueElo.team2[1]!.newElo, delta: leagueElo.team2[1]!.delta },
      ]);
    });
  } else if (flow.matchType === "regular") {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, flow.matchId),
      with: {
        team1Player1: true,
        team1Player2: true,
        team2Player1: true,
        team2Player2: true,
      },
    });

    if (!match?.team1Player1 || !match?.team1Player2 ||
        !match?.team2Player1 || !match?.team2Player2) return;

    const { team1Player1: p1, team1Player2: p2, team2Player1: p3, team2Player2: p4 } = match;
    const team1Won = finalWinner === "team1";

    const scoreMultiplier = getScoreMultiplier(finalSets);
    const eloResult = calculateMatchElo(
      [p1.elo, p2.elo],
      [p3.elo, p4.elo],
      team1Won,
      scoreMultiplier
    );

    const p1Global  = calculateGlobalRating({ attrAttack: p1.attrAttack, attrDefense: p1.attrDefense, attrVolley: p1.attrVolley, attrConsistency: p1.attrConsistency, attrBandeja: p1.attrBandeja, attrRemate: p1.attrRemate });
    const p2Global  = calculateGlobalRating({ attrAttack: p2.attrAttack, attrDefense: p2.attrDefense, attrVolley: p2.attrVolley, attrConsistency: p2.attrConsistency, attrBandeja: p2.attrBandeja, attrRemate: p2.attrRemate });
    const p3Global  = calculateGlobalRating({ attrAttack: p3.attrAttack, attrDefense: p3.attrDefense, attrVolley: p3.attrVolley, attrConsistency: p3.attrConsistency, attrBandeja: p3.attrBandeja, attrRemate: p3.attrRemate });
    const p4Global  = calculateGlobalRating({ attrAttack: p4.attrAttack, attrDefense: p4.attrDefense, attrVolley: p4.attrVolley, attrConsistency: p4.attrConsistency, attrBandeja: p4.attrBandeja, attrRemate: p4.attrRemate });
    const oppAvg    = Math.round((p3Global + p4Global) / 2);
    const team1AvgG = Math.round((p1Global + p2Global) / 2);
    const team1Xp   = calculateXpGain(p1Global, oppAvg, team1Won);
    const team2Xp   = calculateXpGain(p3Global, team1AvgG, !team1Won);

    const p1Level = calculateLevel(p1.xp + team1Xp);
    const p2Level = calculateLevel(p2.xp + team1Xp);
    const p3Level = calculateLevel(p3.xp + team2Xp);
    const p4Level = calculateLevel(p4.xp + team2Xp);

    const p1Sets = getSetsForPlayer(finalSets, true);
    const p2Sets = getSetsForPlayer(finalSets, true);
    const p3Sets = getSetsForPlayer(finalSets, false);
    const p4Sets = getSetsForPlayer(finalSets, false);

    const p1Attrs = calculateAttributeGrowth(
      { attrAttack: p1.attrAttack, attrDefense: p1.attrDefense, attrVolley: p1.attrVolley, attrConsistency: p1.attrConsistency, attrBandeja: p1.attrBandeja, attrRemate: p1.attrRemate },
      eloResult.team1[0]!.newElo, team1Won, p1Sets.setsWon, p1Sets.setsLost, p1.totalWins + p1.totalLosses + 1
    );
    const p2Attrs = calculateAttributeGrowth(
      { attrAttack: p2.attrAttack, attrDefense: p2.attrDefense, attrVolley: p2.attrVolley, attrConsistency: p2.attrConsistency, attrBandeja: p2.attrBandeja, attrRemate: p2.attrRemate },
      eloResult.team1[1]!.newElo, team1Won, p2Sets.setsWon, p2Sets.setsLost, p2.totalWins + p2.totalLosses + 1
    );
    const p3Attrs = calculateAttributeGrowth(
      { attrAttack: p3.attrAttack, attrDefense: p3.attrDefense, attrVolley: p3.attrVolley, attrConsistency: p3.attrConsistency, attrBandeja: p3.attrBandeja, attrRemate: p3.attrRemate },
      eloResult.team2[0]!.newElo, !team1Won, p3Sets.setsWon, p3Sets.setsLost, p3.totalWins + p3.totalLosses + 1
    );
    const p4Attrs = calculateAttributeGrowth(
      { attrAttack: p4.attrAttack, attrDefense: p4.attrDefense, attrVolley: p4.attrVolley, attrConsistency: p4.attrConsistency, attrBandeja: p4.attrBandeja, attrRemate: p4.attrRemate },
      eloResult.team2[1]!.newElo, !team1Won, p4Sets.setsWon, p4Sets.setsLost, p4.totalWins + p4.totalLosses + 1
    );

    await db.transaction(async (tx) => {
      await tx.update(matches).set({
        sets:          finalSets,
        winnerTeam:    finalWinner as "team1" | "team2",
        team1XpGained: team1Xp,
        team2XpGained: team2Xp,
        team1EloDelta: eloResult.team1[0]!.delta,
        team2EloDelta: eloResult.team2[0]!.delta,
        seasonId:      activeSeasonId,
      }).where(eq(matches.id, flow.matchId));

      await tx.update(players).set({
        elo:           eloResult.team1[0]!.newElo,
        xp:            sql`${players.xp} + ${team1Xp}`,
        level:         p1Level.level,
        xpToNextLevel: p1Level.xpToNextLevel,
        totalWins:     team1Won ? sql`${players.totalWins} + 1` : sql`${players.totalWins}`,
        totalLosses:   team1Won ? sql`${players.totalLosses}` : sql`${players.totalLosses} + 1`,
        winStreak:     team1Won ? sql`${players.winStreak} + 1` : 0,
        ...p1Attrs,
        ...(activeSeasonId && !p1.seasonId ? { seasonId: activeSeasonId } : {}),
        updatedAt:     new Date(),
      }).where(eq(players.id, p1.id));

      await tx.update(players).set({
        elo:           eloResult.team1[1]!.newElo,
        xp:            sql`${players.xp} + ${team1Xp}`,
        level:         p2Level.level,
        xpToNextLevel: p2Level.xpToNextLevel,
        totalWins:     team1Won ? sql`${players.totalWins} + 1` : sql`${players.totalWins}`,
        totalLosses:   team1Won ? sql`${players.totalLosses}` : sql`${players.totalLosses} + 1`,
        winStreak:     team1Won ? sql`${players.winStreak} + 1` : 0,
        ...p2Attrs,
        ...(activeSeasonId && !p2.seasonId ? { seasonId: activeSeasonId } : {}),
        updatedAt:     new Date(),
      }).where(eq(players.id, p2.id));

      await tx.update(players).set({
        elo:           eloResult.team2[0]!.newElo,
        xp:            sql`${players.xp} + ${team2Xp}`,
        level:         p3Level.level,
        xpToNextLevel: p3Level.xpToNextLevel,
        totalWins:     !team1Won ? sql`${players.totalWins} + 1` : sql`${players.totalWins}`,
        totalLosses:   !team1Won ? sql`${players.totalLosses}` : sql`${players.totalLosses} + 1`,
        winStreak:     !team1Won ? sql`${players.winStreak} + 1` : 0,
        ...p3Attrs,
        ...(activeSeasonId && !p3.seasonId ? { seasonId: activeSeasonId } : {}),
        updatedAt:     new Date(),
      }).where(eq(players.id, p3.id));

      await tx.update(players).set({
        elo:           eloResult.team2[1]!.newElo,
        xp:            sql`${players.xp} + ${team2Xp}`,
        level:         p4Level.level,
        xpToNextLevel: p4Level.xpToNextLevel,
        totalWins:     !team1Won ? sql`${players.totalWins} + 1` : sql`${players.totalWins}`,
        totalLosses:   !team1Won ? sql`${players.totalLosses}` : sql`${players.totalLosses} + 1`,
        winStreak:     !team1Won ? sql`${players.winStreak} + 1` : 0,
        ...p4Attrs,
        ...(activeSeasonId && !p4.seasonId ? { seasonId: activeSeasonId } : {}),
        updatedAt:     new Date(),
      }).where(eq(players.id, p4.id));

      await tx.insert(eloHistory).values([
        { playerId: p1.id, elo: eloResult.team1[0]!.newElo, delta: eloResult.team1[0]!.delta, matchId: match.id },
        { playerId: p2.id, elo: eloResult.team1[1]!.newElo, delta: eloResult.team1[1]!.delta, matchId: match.id },
        { playerId: p3.id, elo: eloResult.team2[0]!.newElo, delta: eloResult.team2[0]!.delta, matchId: match.id },
        { playerId: p4.id, elo: eloResult.team2[1]!.newElo, delta: eloResult.team2[1]!.delta, matchId: match.id },
      ]);
    });

    // Logros (fuera de transacción)
    const isComeback = finalSets.length >= 3 &&
      (team1Won ? finalSets[0]!.team1 < finalSets[0]!.team2 : finalSets[0]!.team2 < finalSets[0]!.team1);

    const updatedPlayers = await Promise.all([
      db.query.players.findFirst({ where: eq(players.id, p1.id) }),
      db.query.players.findFirst({ where: eq(players.id, p2.id) }),
      db.query.players.findFirst({ where: eq(players.id, p3.id) }),
      db.query.players.findFirst({ where: eq(players.id, p4.id) }),
    ]);

    for (const [i, up] of updatedPlayers.entries()) {
      if (!up) continue;
      const won = i < 2 ? team1Won : !team1Won;
      await evaluateAndAwardAchievements({
        id: up.id, totalWins: up.totalWins, winStreak: up.winStreak,
        level: up.level, attrVolley: up.attrVolley,
        attrConsistency: up.attrConsistency, seasonId: up.seasonId,
      }, isComeback && won);
    }
  }

  // Aplicar puntos de prestigio
  const allPrestigeVotes = await db.query.prestigeVotes.findMany({
    where: eq(prestigeVotes.flowId, flowId),
  });

  const prestigeByTarget = new Map<string, {
    ptsAttack: number; ptsDefense: number; ptsVolley: number;
    ptsBandeja: number; ptsRemate: number;
  }>();

  for (const vote of allPrestigeVotes) {
    const existing = prestigeByTarget.get(vote.targetId) ?? {
      ptsAttack: 0, ptsDefense: 0, ptsVolley: 0, ptsBandeja: 0, ptsRemate: 0
    };
    prestigeByTarget.set(vote.targetId, {
      ptsAttack:  existing.ptsAttack  + vote.ptsAttack,
      ptsDefense: existing.ptsDefense + vote.ptsDefense,
      ptsVolley:  existing.ptsVolley  + vote.ptsVolley,
      ptsBandeja: existing.ptsBandeja + vote.ptsBandeja,
      ptsRemate:  existing.ptsRemate  + vote.ptsRemate,
    });
  }

  for (const [targetId, pts] of prestigeByTarget.entries()) {
    const targetPlayer = await db.query.players.findFirst({
      where: eq(players.id, targetId),
    });
    if (!targetPlayer) continue;

    const newAttrs = applyPrestigePoints(
      {
        attrAttack:      targetPlayer.attrAttack,
        attrDefense:     targetPlayer.attrDefense,
        attrVolley:      targetPlayer.attrVolley,
        attrConsistency: targetPlayer.attrConsistency,
        attrBandeja:     targetPlayer.attrBandeja,
        attrRemate:      targetPlayer.attrRemate,
      },
      {
        attrAttack:  pts.ptsAttack,
        attrDefense: pts.ptsDefense,
        attrVolley:  pts.ptsVolley,
        attrBandeja: pts.ptsBandeja,
        attrRemate:  pts.ptsRemate,
      },
    );

    await db.update(players).set({
      attrAttack:  Math.round(newAttrs.attrAttack),
      attrDefense: Math.round(newAttrs.attrDefense),
      attrVolley:  Math.round(newAttrs.attrVolley),
      attrBandeja: Math.round(newAttrs.attrBandeja),
      attrRemate:  Math.round(newAttrs.attrRemate),
      updatedAt:   new Date(),
    }).where(eq(players.id, targetId));
  }

  // Confirmar MVP
  const mvpVotesList = await db.query.mvpVotes.findMany({
    where: and(
      eq(mvpVotes.matchId,   flow.matchId),
      eq(mvpVotes.matchType, flow.matchType)
    ),
  });

  const voteCount = new Map<string, number>();
  for (const v of mvpVotesList) {
    if (v.nomineeId) {
      voteCount.set(v.nomineeId, (voteCount.get(v.nomineeId) ?? 0) + 1);
    }
  }

  const mvpId = [...voteCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  if (mvpId) {
    const mvpPlayer = await db.query.players.findFirst({
      where: eq(players.id, mvpId),
    });
    if (mvpPlayer) {
      await db.update(players).set({
        xp:        sql`${players.xp} + 50`,
        mvpCount:  sql`${players.mvpCount} + 1`,
        updatedAt: new Date(),
      }).where(eq(players.id, mvpId));

      await db.insert(notifications).values({
        playerId:     mvpId,
        type:         "achievement",
        fromPlayerId: flow.createdBy,
        message:      "🌟 ¡Has sido elegido MVP del partido! +50 XP",
      });
    }
  }

  // Notificar a todos que el flujo está completo
  const completions = await db.query.postmatchCompletions.findMany({
    where: eq(postmatchCompletions.flowId, flowId),
  });

  for (const c of completions) {
    await db.insert(notifications).values({
      playerId:     c.playerId,
      type:         "match_registered",
      fromPlayerId: flow.createdBy,
      message:      "✅ ¡Partido procesado! Entra a ver tus recompensas",
    });
  }
}
