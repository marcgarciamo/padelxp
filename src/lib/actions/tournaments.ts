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

  // Validar formato de UUID para evitar errores de DB
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(partnerId)) throw new Error("ID de compañero inválido");

  if (player.id === partnerId) throw new Error("No puedes ser tu propio compañero");

  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
    with:  { teams: true },
  });

  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.status !== "open") throw new Error("El torneo ya no admite inscripciones");
  if ((tournament.teams?.length ?? 0) >= tournament.maxTeams) throw new Error("Torneo completo");

  // Verificar si alguno ya está inscrito
  const alreadyIn = tournament.teams?.some(t => 
    t.player1Id === player.id || t.player2Id === player.id ||
    t.player1Id === partnerId || t.player2Id === partnerId
  );
  if (alreadyIn) throw new Error("Tú o tu compañero ya estáis inscritos en este torneo");

  // Obtener info del compañero para el nombre
  const partner = await db.query.players.findFirst({
    where: eq(players.id, partnerId)
  });
  if (!partner) throw new Error("El compañero seleccionado no existe");

  await db.insert(tournamentTeams).values({
    tournamentId,
    player1Id: player.id,
    player2Id: partnerId,
    name:      `${player.displayName.split(" ")[0]} & ${partner.displayName.split(" ")[0]}`,
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
    // ... (existing logic)
  });

  revalidatePath("/tournaments");
}

export async function deleteTournament(tournamentId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
  });

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

  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
  });

  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.createdBy !== player.id) throw new Error("Solo el creador puede editar el torneo");

  // Si ya ha empezado, restringir qué se puede editar
  if (tournament.status !== "open") {
    // Solo permitir editar nombre y descripción
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
