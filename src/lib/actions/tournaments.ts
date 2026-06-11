"use server";

import { db } from "@db/index";
import { tournaments, tournamentTeams, tournamentRounds, tournamentMatches, players } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";
import { generateEliminationBracket } from "@lib/bracket";

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

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
    with:  { teams: true },
  });

  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.status !== "open") throw new Error("El torneo ya no admite inscripciones");
  if ((tournament.teams?.length ?? 0) >= tournament.maxTeams) throw new Error("Torneo completo");

  await db.insert(tournamentTeams).values({
    tournamentId,
    player1Id: player.id,
    player2Id: partnerId,
    name:      `${player.displayName.split(" ")[0]} & ${partnerId}`,
  });

  revalidatePath(`/tournaments/${tournamentId}`);
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
  await db.transaction(async (tx) => {
    // 1. Guardar resultado del partido actual
    const [updatedMatch] = await tx.update(tournamentMatches).set({
      sets,
      winnerId,
      playedAt: new Date(),
    }).where(eq(tournamentMatches.id, matchId)).returning();

    if (!updatedMatch) throw new Error("Partido no encontrado");

    // 2. Buscar info de la ronda actual
    const currentRound = await tx.query.tournamentRounds.findFirst({
      where: eq(tournamentRounds.id, updatedMatch.roundId),
    });

    if (!currentRound) return;

    // 3. Buscar la siguiente ronda
    const nextRound = await tx.query.tournamentRounds.findFirst({
      where: and(
        eq(tournamentRounds.tournamentId, updatedMatch.tournamentId),
        eq(tournamentRounds.roundNumber, currentRound.roundNumber + 1)
      ),
    });

    if (nextRound) {
      // 4. Avanzar al equipo ganador al siguiente partido
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
      // 5. No hay siguiente ronda, el torneo ha terminado
      await tx.update(tournaments)
        .set({ status: "finished", finishedAt: new Date() })
        .where(eq(tournaments.id, updatedMatch.tournamentId));

      // Otorgar XP a los ganadores (Opcional, pero muy recomendado en Fase 6)
      const tournament = await tx.query.tournaments.findFirst({
        where: eq(tournaments.id, updatedMatch.tournamentId),
        columns: { xpReward: true }
      });
      const winningTeam = await tx.query.tournamentTeams.findFirst({
        where: eq(tournamentTeams.id, winnerId),
        columns: { player1Id: true, player2Id: true }
      });

      if (tournament && winningTeam) {
        // Otorgar XP a jugador 1
        const p1 = await tx.query.players.findFirst({ where: eq(players.id, winningTeam.player1Id) });
        if (p1) {
           await tx.update(players).set({ xp: p1.xp + tournament.xpReward }).where(eq(players.id, p1.id));
        }
        // Otorgar XP a jugador 2
        const p2 = await tx.query.players.findFirst({ where: eq(players.id, winningTeam.player2Id) });
        if (p2) {
           await tx.update(players).set({ xp: p2.xp + tournament.xpReward }).where(eq(players.id, p2.id));
        }
      }
    }
  });

  revalidatePath("/tournaments");
}
