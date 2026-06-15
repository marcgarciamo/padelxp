"use server";

import { db } from "@db/index";
import { tournaments, tournamentTeams, tournamentRounds, tournamentMatches, players, matches, tournamentInvitations, notifications, eloHistory, achievements } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";
import { generateEliminationBracket } from "@lib/bracket";
import { getFriendshipStatus } from "@lib/queries/social";
import { calculateMatchElo } from "@lib/elo";
import { calculateXpGain, calculateLevel } from "@lib/xp";
import { calculateAttributeGrowth, getSetsForPlayer } from "@lib/attributes";

const CreateTournamentSchema = z.object({
  name:        z.string().min(3),
  description: z.string().optional(),
  format:      z.enum(["elimination", "round_robin"]),
  maxTeams:    z.coerce.number().min(4).max(32),
  xpReward:    z.coerce.number().min(100),
  startsAt:    z.string().optional(),
});

export async function createTournament(input: z.infer<typeof CreateTournamentSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = CreateTournamentSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const [tournament] = await db.insert(tournaments).values({
    ...parsed.data,
    createdBy: player.id,
    startsAt:  parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
  }).returning();

  revalidatePath("/tournaments");
  return tournament;
}

export async function joinTournament(tournamentId: string, partnerId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) throw new Error("Jugador no encontrado");

  // Verificar que son amigos
  const friendship = await getFriendshipStatus(currentPlayer.id, partnerId);
  if (!friendship || friendship.status !== "accepted") {
    throw new Error("Solo puedes apuntarte a torneos con jugadores de tu crew");
  }

  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
    with:  { teams: true },
  });

  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.status !== "open") throw new Error("El torneo ya no admite inscripciones");

  const currentTeams = tournament.teams ?? [];
  if (currentTeams.length >= tournament.maxTeams) throw new Error("Torneo completo");

  // Verificar que ninguno de los dos ya está inscrito
  const allPlayerIds = currentTeams.flatMap((t) => [t.player1Id, t.player2Id]);
  if (allPlayerIds.includes(currentPlayer.id)) throw new Error("Ya estás inscrito en este torneo");
  if (allPlayerIds.includes(partnerId)) throw new Error("Tu compañero ya está inscrito en este torneo");

  // Verificar que no hay invitación pendiente ya
  const existingInvitation = await db.query.tournamentInvitations.findFirst({
    where: and(
      eq(tournamentInvitations.tournamentId, tournamentId),
      eq(tournamentInvitations.inviteeId, partnerId)
    ),
  });
  if (existingInvitation) throw new Error("Ya enviaste una invitación a este jugador para este torneo");

  const partner = await db.query.players.findFirst({
    where: eq(players.id, partnerId),
  });
  if (!partner) throw new Error("Compañero no encontrado");

  // Crear invitación pendiente + notificación
  await db.transaction(async (tx) => {
    await tx.insert(tournamentInvitations).values({
      tournamentId,
      inviterId: currentPlayer.id,
      inviteeId: partnerId,
      status:    "pending",
    });

    await tx.insert(notifications).values({
      playerId:     partnerId,
      type:         "match_registered",
      fromPlayerId: currentPlayer.id,
      message:      `${currentPlayer.displayName} te invita a jugar el torneo "${tournament.name}" como pareja 🏆`,
    });
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/notifications");

  return { invited: true, partnerName: partner.displayName };
}

export async function startTournament(tournamentId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
    with:  { teams: true },
  });

  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.createdBy !== player.id) throw new Error("Solo el creador puede iniciar el torneo");
  if ((tournament.teams?.length ?? 0) < 4) throw new Error("Mínimo 4 equipos para iniciar");

  // Validar que todos los equipos tengan 2 jugadores válidos
  for (const team of tournament.teams ?? []) {
    if (!team.player1Id || !team.player2Id) {
      throw new Error(`Equipo ${team.name} no tiene 2 jugadores válidos`);
    }
  }

  const teamIds = (tournament.teams ?? []).map((t) => t.id);
  const bracketRounds = generateEliminationBracket(teamIds);

  await db.transaction(async (tx) => {
    for (const round of bracketRounds) {
      const [insertedRound] = await tx.insert(tournamentRounds).values({
        tournamentId,
        roundNumber: round.roundNumber,
        name:        round.name,
      }).returning();

      if (!insertedRound) throw new Error("Error generando ronda");

      for (const match of round.matches) {
        await tx.insert(tournamentMatches).values({
          tournamentId,
          roundId:  insertedRound.id,
          team1Id:  match.team1Id ?? undefined,
          team2Id:  match.team2Id ?? undefined,
          position: match.position,
        });
      }
    }

    await tx.update(tournaments)
      .set({ status: "in_progress" })
      .where(eq(tournaments.id, tournamentId));
  });

  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function submitTournamentResult(
  matchId: string,
  sets: Array<{ team1: number; team2: number }>,
  winnerId: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userPlayer = await getPlayerByUserId(session.user.id);
  if (!userPlayer) throw new Error("Jugador no encontrado");

  let matchTournamentId: string | undefined;

  await db.transaction(async (tx) => {
    const [updatedMatch] = await tx.update(tournamentMatches).set({
      sets,
      winnerId,
      playedAt: new Date(),
    }).where(eq(tournamentMatches.id, matchId)).returning();

    if (!updatedMatch) throw new Error("Partido no encontrado");

    if (!updatedMatch.team1Id || !updatedMatch.team2Id) {
      throw new Error("Equipos no asignados en el bracket aún");
    }

    matchTournamentId = updatedMatch.tournamentId;

    const team1 = await tx.query.tournamentTeams.findFirst({ where: eq(tournamentTeams.id, updatedMatch.team1Id), with: { player1: true, player2: true } });
    const team2 = await tx.query.tournamentTeams.findFirst({ where: eq(tournamentTeams.id, updatedMatch.team2Id), with: { player1: true, player2: true } });

    if (!team1 || !team2) throw new Error("Equipos no encontrados");

    const isInTeam1 = team1.player1Id === userPlayer.id || team1.player2Id === userPlayer.id;
    const isInTeam2 = team2.player1Id === userPlayer.id || team2.player2Id === userPlayer.id;
    if (!isInTeam1 && !isInTeam2) {
      const t = await tx.query.tournaments.findFirst({
        where: eq(tournaments.id, updatedMatch.tournamentId),
        columns: { createdBy: true },
      });
      if (!t || t.createdBy !== userPlayer.id) {
        throw new Error("No estás en este partido");
      }
    }

    {
      const tournament = await tx.query.tournaments.findFirst({ where: eq(tournaments.id, updatedMatch.tournamentId) });
      const team1Won = winnerId === updatedMatch.team1Id;

      const p1 = team1.player1;
      const p2 = team1.player2;
      const p3 = team2.player1;
      const p4 = team2.player2;

      if (!p1 || !p2 || !p3 || !p4) throw new Error("Jugadores del equipo no encontrados");

      const eloResult = calculateMatchElo(
        [p1.elo, p2.elo],
        [p3.elo, p4.elo],
        team1Won
      );

      const opp1Avg  = Math.round((p3.elo + p4.elo) / 2);
      const team1Avg = Math.round((p1.elo + p2.elo) / 2);
      const team1Xp  = calculateXpGain(p1.elo, opp1Avg, team1Won);
      const team2Xp  = calculateXpGain(p3.elo, team1Avg, !team1Won);

      const p1Level = calculateLevel(p1.xp + team1Xp);
      const p2Level = calculateLevel(p2.xp + team1Xp);
      const p3Level = calculateLevel(p3.xp + team2Xp);
      const p4Level = calculateLevel(p4.xp + team2Xp);

      const p1Sets = getSetsForPlayer(sets, true);
      const p1Attrs = calculateAttributeGrowth(
        { attrAttack: p1.attrAttack, attrDefense: p1.attrDefense, attrVolley: p1.attrVolley, attrConsistency: p1.attrConsistency },
        team1Won, p1Sets.setsWon, p1Sets.setsLost, p1.totalWins + p1.totalLosses + 1
      );
      const p2Attrs = calculateAttributeGrowth(
        { attrAttack: p2.attrAttack, attrDefense: p2.attrDefense, attrVolley: p2.attrVolley, attrConsistency: p2.attrConsistency },
        team1Won, p1Sets.setsWon, p1Sets.setsLost, p2.totalWins + p2.totalLosses + 1
      );
      const p3Sets = getSetsForPlayer(sets, false);
      const p3Attrs = calculateAttributeGrowth(
        { attrAttack: p3.attrAttack, attrDefense: p3.attrDefense, attrVolley: p3.attrVolley, attrConsistency: p3.attrConsistency },
        !team1Won, p3Sets.setsWon, p3Sets.setsLost, p3.totalWins + p3.totalLosses + 1
      );
      const p4Attrs = calculateAttributeGrowth(
        { attrAttack: p4.attrAttack, attrDefense: p4.attrDefense, attrVolley: p4.attrVolley, attrConsistency: p4.attrConsistency },
        !team1Won, p3Sets.setsWon, p3Sets.setsLost, p4.totalWins + p4.totalLosses + 1
      );

      const [insertedMatch] = await tx.insert(matches).values({
        venue:          "Torneo: " + (tournament?.name ?? "PadelXP"),
        playedAt:       new Date(),
        team1Player1Id: team1.player1Id,
        team1Player2Id: team1.player2Id,
        team2Player1Id: team2.player1Id,
        team2Player2Id: team2.player2Id,
        winnerTeam:     team1Won ? "team1" : "team2",
        sets,
        team1XpGained:  team1Xp,
        team2XpGained:  team2Xp,
        team1EloDelta:  eloResult.team1[0]!.delta,
        team2EloDelta:  eloResult.team2[0]!.delta,
        createdBy:      userPlayer.id,
        seasonId:       userPlayer.seasonId,
      }).returning();

      await tx.update(players).set({
        elo: eloResult.team1[0]!.newElo, xp: p1.xp + team1Xp,
        level: p1Level.level, xpToNextLevel: p1Level.xpToNextLevel,
        totalWins: team1Won ? p1.totalWins + 1 : p1.totalWins,
        totalLosses: team1Won ? p1.totalLosses : p1.totalLosses + 1,
        winStreak: team1Won ? p1.winStreak + 1 : 0,
        ...p1Attrs, updatedAt: new Date(),
      }).where(eq(players.id, p1.id));

      await tx.update(players).set({
        elo: eloResult.team1[1]!.newElo, xp: p2.xp + team1Xp,
        level: p2Level.level, xpToNextLevel: p2Level.xpToNextLevel,
        totalWins: team1Won ? p2.totalWins + 1 : p2.totalWins,
        totalLosses: team1Won ? p2.totalLosses : p2.totalLosses + 1,
        winStreak: team1Won ? p2.winStreak + 1 : 0,
        ...p2Attrs, updatedAt: new Date(),
      }).where(eq(players.id, p2.id));

      await tx.update(players).set({
        elo: eloResult.team2[0]!.newElo, xp: p3.xp + team2Xp,
        level: p3Level.level, xpToNextLevel: p3Level.xpToNextLevel,
        totalWins: !team1Won ? p3.totalWins + 1 : p3.totalWins,
        totalLosses: !team1Won ? p3.totalLosses : p3.totalLosses + 1,
        winStreak: !team1Won ? p3.winStreak + 1 : 0,
        ...p3Attrs, updatedAt: new Date(),
      }).where(eq(players.id, p3.id));

      await tx.update(players).set({
        elo: eloResult.team2[1]!.newElo, xp: p4.xp + team2Xp,
        level: p4Level.level, xpToNextLevel: p4Level.xpToNextLevel,
        totalWins: !team1Won ? p4.totalWins + 1 : p4.totalWins,
        totalLosses: !team1Won ? p4.totalLosses : p4.totalLosses + 1,
        winStreak: !team1Won ? p4.winStreak + 1 : 0,
        ...p4Attrs, updatedAt: new Date(),
      }).where(eq(players.id, p4.id));

      if (insertedMatch) {
        await tx.insert(eloHistory).values([
          { playerId: p1.id, elo: eloResult.team1[0]!.newElo, delta: eloResult.team1[0]!.delta, matchId: insertedMatch.id },
          { playerId: p2.id, elo: eloResult.team1[1]!.newElo, delta: eloResult.team1[1]!.delta, matchId: insertedMatch.id },
          { playerId: p3.id, elo: eloResult.team2[0]!.newElo, delta: eloResult.team2[0]!.delta, matchId: insertedMatch.id },
          { playerId: p4.id, elo: eloResult.team2[1]!.newElo, delta: eloResult.team2[1]!.delta, matchId: insertedMatch.id },
        ]);
      }
    }

    const currentRound = await tx.query.tournamentRounds.findFirst({
      where: eq(tournamentRounds.id, updatedMatch.roundId),
    });

    if (!currentRound) return;

    const nextRound = await tx.query.tournamentRounds.findFirst({
      where: and(
        eq(tournamentRounds.tournamentId, updatedMatch.tournamentId),
        eq(tournamentRounds.roundNumber, currentRound.roundNumber + 1)
      ),
    });

    if (nextRound) {
      const nextPosition = Math.floor(updatedMatch.position / 2);
      const isTeam1 = updatedMatch.position % 2 === 0;

      const nextMatch = await tx.query.tournamentMatches.findFirst({
        where: and(
          eq(tournamentMatches.roundId, nextRound.id),
          eq(tournamentMatches.position, nextPosition)
        ),
      });

      if (nextMatch) {
        await tx.update(tournamentMatches).set(
          isTeam1 ? { team1Id: winnerId } : { team2Id: winnerId }
        ).where(eq(tournamentMatches.id, nextMatch.id));
      }
    } else {
      await tx.update(tournaments)
        .set({ status: "finished", finishedAt: new Date() })
        .where(eq(tournaments.id, updatedMatch.tournamentId));

      const tournament = await tx.query.tournaments.findFirst({
        where: eq(tournaments.id, updatedMatch.tournamentId),
      });
      const winningTeam = await tx.query.tournamentTeams.findFirst({
        where: eq(tournamentTeams.id, winnerId),
      });

      if (tournament && winningTeam) {
        const p1 = await tx.query.players.findFirst({ where: eq(players.id, winningTeam.player1Id) });
        if (p1) await tx.update(players).set({ xp: p1.xp + tournament.xpReward }).where(eq(players.id, p1.id));
        const p2 = await tx.query.players.findFirst({ where: eq(players.id, winningTeam.player2Id) });
        if (p2) await tx.update(players).set({ xp: p2.xp + tournament.xpReward }).where(eq(players.id, p2.id));
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/matches");
  revalidatePath("/tournaments");
  if (matchTournamentId) revalidatePath(`/tournaments/${matchTournamentId}`);
}

export async function deleteTournament(tournamentId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const tournament = await db.query.tournaments.findFirst({ where: eq(tournaments.id, tournamentId) });

  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.createdBy !== player.id) throw new Error("Solo el creador puede eliminar el torneo");

  await db.delete(tournaments).where(eq(tournaments.id, tournamentId));

  revalidatePath("/tournaments");
  redirect("/tournaments");
}

export async function updateTournament(
  tournamentId: string,
  data: {
    name?: string;
    description?: string;
    maxTeams?: number;
    xpReward?: number;
    startsAt?: string | undefined;
  }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const tournament = await db.query.tournaments.findFirst({ where: eq(tournaments.id, tournamentId) });

  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.createdBy !== player.id) throw new Error("Solo el creador puede editar el torneo");

  if (tournament.status !== "open") {
    await db.update(tournaments).set({
      name: data.name ?? tournament.name,
      description: data.description ?? tournament.description,
    }).where(eq(tournaments.id, tournamentId));
  } else {
    await db.update(tournaments).set({
      name: data.name ?? tournament.name,
      description: data.description ?? tournament.description,
      maxTeams: data.maxTeams ?? tournament.maxTeams,
      xpReward: data.xpReward ?? tournament.xpReward,
      startsAt: data.startsAt ? new Date(data.startsAt) : tournament.startsAt,
    }).where(eq(tournaments.id, tournamentId));
  }

  revalidatePath(`/tournaments/${tournamentId}`);
}
