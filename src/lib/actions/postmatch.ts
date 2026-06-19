"use server";

import { db } from "@db/index";
import {
  postmatchFlows, postmatchValidations, postmatchCompletions,
  prestigeVotes, mvpVotes, players, notifications,
  leagueMatches, leagueTeams, leagueRounds, leagues,
  matches, eloHistory,
} from "@db/schema";
import { eq, and } from "drizzle-orm";
import { calculateMatchElo } from "@lib/elo";
import { calculateXpGain, calculateLevel } from "@lib/xp";
import { calculateAttributeGrowth, calculateGlobalRating, getSetsForPlayer } from "@lib/attributes";
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

export async function validateResult(input: z.infer<typeof ValidationSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const parsed = ValidationSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const flow = await db.query.postmatchFlows.findFirst({
    where: eq(postmatchFlows.id, parsed.data.flowId),
    with:  { completions: true, validations: true },
  });

  if (!flow) throw new Error("Flujo no encontrado");
  if (new Date() > flow.expiresAt) throw new Error("El tiempo de validación ha expirado");
  if (flow.status === "completed") throw new Error("Este partido ya está completado");

  const myCompletion = flow.completions.find((c) => c.playerId === player.id);
  if (!myCompletion) throw new Error("No participas en este partido");
  if (myCompletion.validated) throw new Error("Ya has validado este resultado");

  await db.transaction(async (tx) => {
    await tx.insert(postmatchValidations).values({
      flowId:    flow.id,
      playerId:  player.id,
      confirms:  parsed.data.confirms,
      altSets:   parsed.data.altSets,
      altWinner: parsed.data.altWinner,
    }).onConflictDoNothing();

    await tx.update(postmatchCompletions).set({
      validated: true,
    }).where(and(
      eq(postmatchCompletions.flowId, flow.id),
      eq(postmatchCompletions.playerId, player.id)
    ));

    const newCount = flow.validationsCount + 1;
    await tx.update(postmatchFlows).set({
      validationsCount: newCount,
      status: newCount >= 4 ? "pending_voting" : "pending_validation",
    }).where(eq(postmatchFlows.id, flow.id));
  });

  revalidatePath("/postmatch/" + flow.id);
  return { validationsCount: flow.validationsCount + 1 };
}

// ── Paso 3: Votar MVP ─────────────────────────────────────────────────────

export async function submitMvpVote(flowId: string, nomineeId: string | null) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const flow = await db.query.postmatchFlows.findFirst({
    where: eq(postmatchFlows.id, flowId),
    with:  { completions: true },
  });

  if (!flow) throw new Error("Flujo no encontrado");
  if (flow.status !== "pending_voting") throw new Error("Aún no es el momento de votar");
  if (new Date() > flow.expiresAt) throw new Error("El tiempo de validación ha expirado");
  if (nomineeId && nomineeId === player.id) throw new Error("No puedes votarte a ti mismo");

  const myCompletion = flow.completions.find((c) => c.playerId === player.id);
  if (!myCompletion) throw new Error("No participas en este partido");
  if (myCompletion.mvpVoted) throw new Error("Ya has votado el MVP");

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

export async function submitPrestigeVotes(input: z.infer<typeof PrestigeSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const parsed = PrestigeSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  for (const vote of parsed.data.votes) {
    const total = vote.ptsAttack + vote.ptsDefense + vote.ptsVolley + vote.ptsBandeja + vote.ptsRemate;
    if (total !== 3) throw new Error(`Debes repartir exactamente 3 puntos por jugador (actual: ${total})`);
  }

  const flow = await db.query.postmatchFlows.findFirst({
    where: eq(postmatchFlows.id, parsed.data.flowId),
    with:  { completions: true },
  });

  if (!flow) throw new Error("Flujo no encontrado");
  if (new Date() > flow.expiresAt) throw new Error("El tiempo de validación ha expirado");
  if (flow.status === "completed") throw new Error("Este partido ya está completado");

  const myCompletion = flow.completions.find((c) => c.playerId === player.id);
  if (!myCompletion) throw new Error("No participas en este partido");
  if (myCompletion.prestigeDone) throw new Error("Ya has repartido los puntos de prestigio");

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
}

// ── Procesar flujo completado ─────────────────────────────────────────────

async function processCompletedFlow(flowId: string) {
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

    if (winnerTeam) {
      await db.update(leagueTeams).set({
        points:   winnerTeam.points + (match.league?.pointsWin ?? 3),
        wins:     winnerTeam.wins + 1,
        setsWon:  winnerTeam.setsWon + winningSets,
        setsLost: winnerTeam.setsLost + losingSets,
      }).where(eq(leagueTeams.id, winnerId));
    }
    if (loserTeam) {
      await db.update(leagueTeams).set({
        losses:   loserTeam.losses + 1,
        setsWon:  loserTeam.setsWon + losingSets,
        setsLost: loserTeam.setsLost + winningSets,
      }).where(eq(leagueTeams.id, loserId));
    }

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

    const eloResult = calculateMatchElo(
      [p1.elo, p2.elo],
      [p3.elo, p4.elo],
      team1Won
    );

    const p1Global  = calculateGlobalRating({ attrAttack: p1.attrAttack, attrDefense: p1.attrDefense, attrVolley: p1.attrVolley, attrConsistency: p1.attrConsistency });
    const p2Global  = calculateGlobalRating({ attrAttack: p2.attrAttack, attrDefense: p2.attrDefense, attrVolley: p2.attrVolley, attrConsistency: p2.attrConsistency });
    const p3Global  = calculateGlobalRating({ attrAttack: p3.attrAttack, attrDefense: p3.attrDefense, attrVolley: p3.attrVolley, attrConsistency: p3.attrConsistency });
    const p4Global  = calculateGlobalRating({ attrAttack: p4.attrAttack, attrDefense: p4.attrDefense, attrVolley: p4.attrVolley, attrConsistency: p4.attrConsistency });
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
      { attrAttack: p1.attrAttack, attrDefense: p1.attrDefense, attrVolley: p1.attrVolley, attrConsistency: p1.attrConsistency },
      eloResult.team1[0]!.newElo, team1Won, p1Sets.setsWon, p1Sets.setsLost, p1.totalWins + p1.totalLosses + 1
    );
    const p2Attrs = calculateAttributeGrowth(
      { attrAttack: p2.attrAttack, attrDefense: p2.attrDefense, attrVolley: p2.attrVolley, attrConsistency: p2.attrConsistency },
      eloResult.team1[1]!.newElo, team1Won, p2Sets.setsWon, p2Sets.setsLost, p2.totalWins + p2.totalLosses + 1
    );
    const p3Attrs = calculateAttributeGrowth(
      { attrAttack: p3.attrAttack, attrDefense: p3.attrDefense, attrVolley: p3.attrVolley, attrConsistency: p3.attrConsistency },
      eloResult.team2[0]!.newElo, !team1Won, p3Sets.setsWon, p3Sets.setsLost, p3.totalWins + p3.totalLosses + 1
    );
    const p4Attrs = calculateAttributeGrowth(
      { attrAttack: p4.attrAttack, attrDefense: p4.attrDefense, attrVolley: p4.attrVolley, attrConsistency: p4.attrConsistency },
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
      }).where(eq(matches.id, flow.matchId));

      await tx.update(players).set({
        elo:           eloResult.team1[0]!.newElo,
        xp:            p1.xp + team1Xp,
        level:         p1Level.level,
        xpToNextLevel: p1Level.xpToNextLevel,
        totalWins:     team1Won ? p1.totalWins + 1 : p1.totalWins,
        totalLosses:   team1Won ? p1.totalLosses : p1.totalLosses + 1,
        winStreak:     team1Won ? p1.winStreak + 1 : 0,
        ...p1Attrs,
        updatedAt:     new Date(),
      }).where(eq(players.id, p1.id));

      await tx.update(players).set({
        elo:           eloResult.team1[1]!.newElo,
        xp:            p2.xp + team1Xp,
        level:         p2Level.level,
        xpToNextLevel: p2Level.xpToNextLevel,
        totalWins:     team1Won ? p2.totalWins + 1 : p2.totalWins,
        totalLosses:   team1Won ? p2.totalLosses : p2.totalLosses + 1,
        winStreak:     team1Won ? p2.winStreak + 1 : 0,
        ...p2Attrs,
        updatedAt:     new Date(),
      }).where(eq(players.id, p2.id));

      await tx.update(players).set({
        elo:           eloResult.team2[0]!.newElo,
        xp:            p3.xp + team2Xp,
        level:         p3Level.level,
        xpToNextLevel: p3Level.xpToNextLevel,
        totalWins:     !team1Won ? p3.totalWins + 1 : p3.totalWins,
        totalLosses:   !team1Won ? p3.totalLosses : p3.totalLosses + 1,
        winStreak:     !team1Won ? p3.winStreak + 1 : 0,
        ...p3Attrs,
        updatedAt:     new Date(),
      }).where(eq(players.id, p3.id));

      await tx.update(players).set({
        elo:           eloResult.team2[1]!.newElo,
        xp:            p4.xp + team2Xp,
        level:         p4Level.level,
        xpToNextLevel: p4Level.xpToNextLevel,
        totalWins:     !team1Won ? p4.totalWins + 1 : p4.totalWins,
        totalLosses:   !team1Won ? p4.totalLosses : p4.totalLosses + 1,
        winStreak:     !team1Won ? p4.winStreak + 1 : 0,
        ...p4Attrs,
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

    const updatedP1 = await db.query.players.findFirst({ where: eq(players.id, p1.id) });
    if (updatedP1) {
      await evaluateAndAwardAchievements({
        id: updatedP1.id, totalWins: updatedP1.totalWins, winStreak: updatedP1.winStreak,
        level: updatedP1.level, attrVolley: updatedP1.attrVolley,
        attrConsistency: updatedP1.attrConsistency, seasonId: updatedP1.seasonId,
      }, isComeback && team1Won);
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

  const PRESTIGE_FACTOR = 0.33;

  for (const [targetId, pts] of prestigeByTarget.entries()) {
    const targetPlayer = await db.query.players.findFirst({
      where: eq(players.id, targetId),
    });
    if (!targetPlayer) continue;

    await db.update(players).set({
      attrAttack:  Math.min(99, Math.round(targetPlayer.attrAttack  + pts.ptsAttack  * PRESTIGE_FACTOR)),
      attrDefense: Math.min(99, Math.round(targetPlayer.attrDefense + pts.ptsDefense * PRESTIGE_FACTOR)),
      attrVolley:  Math.min(99, Math.round(targetPlayer.attrVolley  + pts.ptsVolley  * PRESTIGE_FACTOR)),
      attrBandeja: Math.min(99, Math.round(targetPlayer.attrBandeja + pts.ptsBandeja * PRESTIGE_FACTOR)),
      attrRemate:  Math.min(99, Math.round(targetPlayer.attrRemate  + pts.ptsRemate  * PRESTIGE_FACTOR)),
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
        xp:        mvpPlayer.xp + 50,
        mvpCount:  mvpPlayer.mvpCount + 1,
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
