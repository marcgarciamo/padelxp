"use server";

import { db } from "@db/index";
import {
  postmatchFlows, postmatchValidations, postmatchCompletions,
  prestigeVotes, mvpVotes, players, notifications,
  leagueMatches, leagueTeams, leagueRounds, leagues,
} from "@db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";

// ── Paso 1: Crear el flujo cuando se registra el partido ──────────────────

export async function createPostmatchFlow(
  matchId:   string,
  matchType: "league" | "tournament",
  proposedSets: Array<{ team1: number; team2: number }>,
  proposedWinner: "team1" | "team2",
  allPlayerIds: string[]
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const creator = await getPlayerByUserId(session.user.id);
  if (!creator) throw new Error("Jugador no encontrado");

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    const [flow] = await tx.insert(postmatchFlows).values({
      matchId,
      matchType,
      status:           "pending_validation",
      createdBy:        creator.id,
      proposedSets,
      proposedWinner,
      validationsCount: 1,
      expiresAt,
    }).returning();

    if (!flow) return;

    for (const playerId of allPlayerIds) {
      await tx.insert(postmatchCompletions).values({
        flowId:    flow.id,
        playerId,
        validated: playerId === creator.id,
      }).onConflictDoNothing();
    }

    for (const playerId of allPlayerIds.filter((id) => id !== creator.id)) {
      await tx.insert(notifications).values({
        playerId,
        type:         "match_registered",
        fromPlayerId: creator.id,
        flowId:       flow.id,
        message:      `${creator.displayName} ha subido el resultado de vuestro partido. ¡Entra a validarlo! ⏱ 24h`,
      });
    }
  });
}

// ── Paso 2: Validar el resultado ──────────────────────────────────────────

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
