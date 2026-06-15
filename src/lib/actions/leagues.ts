"use server";

import { db } from "@db/index";
import { leagues, leagueTeams, leagueRounds, leagueMatches, leagueInvites, notifications } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";
import { getAcceptedFriends } from "@lib/queries/social";
import { generateRoundRobinDouble } from "@lib/league-engine";

// ── Crear liga ────────────────────────────────────────────────────────────

const CreateLeagueSchema = z.object({
  name:        z.string().min(3).max(60),
  description: z.string().max(200).optional(),
  xpPerWin:    z.coerce.number().min(50).max(500).default(150),
});

export async function createLeague(input: z.infer<typeof CreateLeagueSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = CreateLeagueSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const season = await db.query.seasons.findFirst({
    where: (s, { eq }) => eq(s.isActive, true),
    columns: { id: true },
  });

  const [league] = await db.insert(leagues).values({
    ...parsed.data,
    createdBy:   player.id,
    status:      "open",
    totalRounds: 0,
    seasonId:    season?.id,
  }).returning();

  revalidatePath("/leagues");
  return league;
}

// ── Invitar a una liga ────────────────────────────────────────────────────

export async function inviteToLeague(leagueId: string, partnerId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const friends = await getAcceptedFriends(player.id);
  if (!friends.some((f) => f.id === partnerId)) throw new Error("Solo puedes invitar a jugadores de tu crew");

  const league = await db.query.leagues.findFirst({
    where: eq(leagues.id, leagueId),
    with:  { teams: true, invites: true },
  });
  if (!league) throw new Error("Liga no encontrada");
  if (league.status !== "open") throw new Error("La liga ya no admite inscripciones");

  const allIds = (league.teams ?? []).flatMap((t) => [t.player1Id, t.player2Id]);
  if (allIds.includes(player.id)) throw new Error("Ya estás inscrito en esta liga");
  if (allIds.includes(partnerId)) throw new Error("Tu compañero ya está inscrito");

  const pendingInvites = (league.invites ?? []).filter((i) => i.status === "pending");
  const alreadyInvited = pendingInvites.some(
    (i) => (i.inviterId === player.id && i.inviteeId === partnerId) ||
            (i.inviterId === partnerId && i.inviteeId === player.id)
  );
  if (alreadyInvited) throw new Error("Ya existe una invitación pendiente con este jugador");
  if (pendingInvites.some((i) => i.inviterId === player.id)) throw new Error("Ya tienes una invitación pendiente");

  const partner = await db.query.players.findFirst({ where: (p, { eq }) => eq(p.id, partnerId) });
  if (!partner) throw new Error("Compañero no encontrado");

  await db.insert(leagueInvites).values({ leagueId, inviterId: player.id, inviteeId: partnerId });

  await db.insert(notifications).values({
    playerId:     partnerId,
    type:         "match_registered",
    fromPlayerId: player.id,
    message:      `${player.displayName} te ha invitado a la liga "${league.name}" 🎾 — Acepta en la página de la liga`,
  });

  revalidatePath(`/leagues/${leagueId}`);
}

// ── Aceptar invitación ────────────────────────────────────────────────────

export async function acceptLeagueInvite(inviteId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("No autenticado");

  const invite = await db.query.leagueInvites.findFirst({
    where: eq(leagueInvites.id, inviteId),
    with:  { league: true, inviter: true },
  });
  if (!invite) throw new Error("Invitación no encontrada");
  if (invite.inviteeId !== player.id) throw new Error("No autorizado");
  if (invite.status !== "pending") throw new Error("Esta invitación ya fue procesada");
  if (invite.league.status !== "open") throw new Error("La liga ya no admite inscripciones");

  const existingTeams = await db.query.leagueTeams.findMany({
    where: eq(leagueTeams.leagueId, invite.leagueId),
  });
  const allIds = existingTeams.flatMap((t) => [t.player1Id, t.player2Id]);
  if (allIds.includes(player.id)) throw new Error("Ya estás inscrito en esta liga");
  if (allIds.includes(invite.inviterId)) throw new Error("Tu compañero ya está en otra pareja");

  await db.transaction(async (tx) => {
    await tx.update(leagueInvites)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(leagueInvites.id, inviteId));

    await tx.insert(leagueTeams).values({
      leagueId:  invite.leagueId,
      player1Id: invite.inviterId,
      player2Id: player.id,
      name:      `${invite.inviter.displayName.split(" ")[0]} & ${player.displayName.split(" ")[0]}`,
      points: 0, wins: 0, losses: 0, setsWon: 0, setsLost: 0,
    });

    await tx.insert(notifications).values({
      playerId:     invite.inviterId,
      type:         "match_registered",
      fromPlayerId: player.id,
      message:      `${player.displayName} aceptó tu invitación a la liga "${invite.league.name}" 🎾`,
    });
  });

  revalidatePath(`/leagues/${invite.leagueId}`);
  revalidatePath("/leagues");
}

// ── Rechazar invitación ───────────────────────────────────────────────────

export async function rejectLeagueInvite(inviteId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("No autenticado");

  const invite = await db.query.leagueInvites.findFirst({
    where: eq(leagueInvites.id, inviteId),
  });
  if (!invite) throw new Error("Invitación no encontrada");
  if (invite.inviteeId !== player.id) throw new Error("No autorizado");

  await db.update(leagueInvites)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(leagueInvites.id, inviteId));

  revalidatePath(`/leagues/${invite.leagueId}`);
}

// ── Cancelar invitación ───────────────────────────────────────────────────

export async function cancelLeagueInvite(inviteId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("No autenticado");

  const invite = await db.query.leagueInvites.findFirst({
    where: eq(leagueInvites.id, inviteId),
  });
  if (!invite) throw new Error("Invitación no encontrada");
  if (invite.inviterId !== player.id) throw new Error("No autorizado");
  if (invite.status !== "pending") throw new Error("Esta invitación ya fue procesada");

  await db.delete(leagueInvites).where(eq(leagueInvites.id, inviteId));

  revalidatePath(`/leagues/${invite.leagueId}`);
}

// ── Salir de la liga ──────────────────────────────────────────────────────

export async function leaveLeague(leagueId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("No autenticado");

  const league = await db.query.leagues.findFirst({ where: eq(leagues.id, leagueId) });
  if (!league) throw new Error("Liga no encontrada");
  if (league.status !== "open") throw new Error("No puedes salir de una liga ya iniciada");

  const team = await db.query.leagueTeams.findFirst({
    where: (t, { and, or, eq }) => and(
      eq(t.leagueId, leagueId),
      or(eq(t.player1Id, player.id), eq(t.player2Id, player.id))
    ),
  });
  if (!team) throw new Error("No estás inscrito en esta liga");

  await db.delete(leagueTeams).where(eq(leagueTeams.id, team.id));

  revalidatePath(`/leagues/${leagueId}`);
  revalidatePath("/leagues");
}

// ── Iniciar liga ──────────────────────────────────────────────────────────

export async function startLeague(leagueId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("No autenticado");

  const league = await db.query.leagues.findFirst({
    where: eq(leagues.id, leagueId),
    with:  { teams: true },
  });

  if (!league) throw new Error("Liga no encontrada");
  if (league.createdBy !== player.id) throw new Error("Solo el creador puede iniciar la liga");
  if (league.status !== "open") throw new Error("La liga ya está iniciada");
  if ((league.teams?.length ?? 0) < 3) throw new Error("Mínimo 3 equipos para iniciar");

  const teamIds  = (league.teams ?? []).map((t) => t.id);
  const calendar = generateRoundRobinDouble(teamIds);

  await db.transaction(async (tx) => {
    for (const round of calendar) {
      const [insertedRound] = await tx.insert(leagueRounds).values({
        leagueId,
        roundNumber: round.roundNumber,
        completed:   false,
      }).returning();

      if (!insertedRound) continue;

      for (const match of round.matches) {
        await tx.insert(leagueMatches).values({
          leagueId,
          roundId:  insertedRound.id,
          team1Id:  match.team1Id,
          team2Id:  match.team2Id,
          winnerId: null,
          sets:     null,
        });
      }
    }

    await tx.update(leagues).set({
      status:      "in_progress",
      totalRounds: calendar.length,
    }).where(eq(leagues.id, leagueId));
  });

  const allTeams = await db.query.leagueTeams.findMany({
    where: eq(leagueTeams.leagueId, leagueId),
    with: { player1: true, player2: true },
  });

  for (const team of allTeams) {
    for (const p of [team.player1, team.player2]) {
      if (!p || p.id === player.id) continue;
      await db.insert(notifications).values({
        playerId:     p.id,
        type:         "match_registered",
        fromPlayerId: player.id,
        message:      `¡La liga "${league.name}" ha comenzado! Se han generado ${calendar.length} jornadas 🏆`,
      });
    }
  }

  revalidatePath(`/leagues/${leagueId}`);
}

// ── Introducir resultado ──────────────────────────────────────────────────

const MatchResultSchema = z.object({
  matchId:  z.string().uuid(),
  sets:     z.array(z.object({
    team1: z.number().min(0).max(7),
    team2: z.number().min(0).max(7),
  })).min(1).max(3),
  winnerId: z.string().uuid(),
});

export async function submitLeagueResult(input: z.infer<typeof MatchResultSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = MatchResultSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const { matchId, sets, winnerId } = parsed.data;

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("No autenticado");

  const match = await db.query.leagueMatches.findFirst({
    where: eq(leagueMatches.id, matchId),
    with: { league: true, team1: true, team2: true },
  });

  if (!match) throw new Error("Partido no encontrado");
  if (match.league.createdBy !== player.id) throw new Error("Solo el creador puede introducir resultados");
  if (match.winnerId) throw new Error("Este partido ya tiene resultado");

  const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;

  let winningSets = 0, losingSets = 0;
  for (const s of sets) {
    const isTeam1Winner = winnerId === match.team1Id;
    const winnerGames   = isTeam1Winner ? s.team1 : s.team2;
    const loserGames    = isTeam1Winner ? s.team2 : s.team1;
    if (winnerGames > loserGames) winningSets++; else losingSets++;
  }

  await db.transaction(async (tx) => {
    await tx.update(leagueMatches).set({ sets, winnerId, playedAt: new Date() })
      .where(eq(leagueMatches.id, matchId));

    const winnerTeam = await tx.query.leagueTeams.findFirst({ where: eq(leagueTeams.id, winnerId) });
    if (winnerTeam) {
      await tx.update(leagueTeams).set({
        points:   winnerTeam.points + 3,
        wins:     winnerTeam.wins + 1,
        setsWon:  winnerTeam.setsWon + winningSets,
        setsLost: winnerTeam.setsLost + losingSets,
      }).where(eq(leagueTeams.id, winnerId));
    }

    const loserTeam = await tx.query.leagueTeams.findFirst({ where: eq(leagueTeams.id, loserId) });
    if (loserTeam) {
      await tx.update(leagueTeams).set({
        losses:   loserTeam.losses + 1,
        setsWon:  loserTeam.setsWon + losingSets,
        setsLost: loserTeam.setsLost + winningSets,
      }).where(eq(leagueTeams.id, loserId));
    }

    // Comprobar si la jornada está completa
    const roundMatches = await tx.query.leagueMatches.findMany({
      where: eq(leagueMatches.roundId, match.roundId),
    });
    const allDone = roundMatches.every((m) => m.winnerId !== null || m.id === matchId);
    if (allDone) {
      await tx.update(leagueRounds).set({ completed: true })
        .where(eq(leagueRounds.id, match.roundId));
    }

    // Comprobar si la liga está completa
    const allRounds = await tx.query.leagueRounds.findMany({
      where: eq(leagueRounds.leagueId, match.leagueId),
    });
    const leagueDone = allRounds.every((r) => r.completed || r.id === match.roundId);
    if (leagueDone) {
      await tx.update(leagues).set({ status: "finished" })
        .where(eq(leagues.id, match.leagueId));
    }
  });

  revalidatePath(`/leagues/${match.leagueId}`);
}
