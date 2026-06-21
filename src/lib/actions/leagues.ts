"use server";

import { db } from "@db/index";
import { leagues, leagueTeams, leagueRounds, leagueMatches, leagueInvites, leagueIndividualRegistrations, notifications, players, postmatchFlows, postmatchCompletions } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";
import { getAcceptedFriends } from "@lib/queries/social";
import { generateRoundRobinDouble } from "@lib/league-engine";
import { generateInviteCode, generateVariablePairings, validateParticipantCount } from "@lib/league-utils";

// ── Crear liga ────────────────────────────────────────────────────────────

const CreateLeagueSchema = z.object({
  name:                z.string().min(3, "Mínimo 3 caracteres").max(60),
  description:         z.string().max(200).optional(),
  visibility:          z.enum(["public", "private"]).default("public"),
  teamFormat:          z.enum(["fixed_pairs", "individual"]).default("fixed_pairs"),
  maxParticipants:     z.coerce.number().min(4).max(64).default(16),
  totalRounds:         z.coerce.number().min(0).max(30).default(0),
  startDate:           z.string().optional(),
  courtManagement:     z.enum(["centralized", "decentralized"]).default("decentralized"),
  matchFormat:         z.enum(["best_of_3", "best_of_3_supertiebreak", "timed"]).default("best_of_3"),
  scoringSystem:       z.enum(["classic_advantage", "golden_point", "star_point"]).default("golden_point"),
  pointsWin:           z.coerce.number().min(0).max(10).default(3),
  pointsLoss:          z.coerce.number().min(0).max(10).default(0),
  pointsWo:            z.coerce.number().min(0).max(10).default(0),
  gamificationEnabled: z.boolean().default(true),
  xpPerWin:            z.coerce.number().min(0).max(500).default(150),
});

export type CreateLeagueInput = z.infer<typeof CreateLeagueSchema>;

export async function createLeague(input: CreateLeagueInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = CreateLeagueSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const validation = validateParticipantCount(parsed.data.maxParticipants, parsed.data.teamFormat);
  if (!validation.valid) throw new Error(validation.message);

  const season = await db.query.seasons.findFirst({
    where: (s, { eq }) => eq(s.isActive, true),
    columns: { id: true },
  });

  const inviteCode = parsed.data.visibility === "private" ? generateInviteCode() : null;

  const [league] = await db.insert(leagues).values({
    name:                parsed.data.name,
    description:         parsed.data.description,
    visibility:          parsed.data.visibility,
    inviteCode,
    teamFormat:          parsed.data.teamFormat,
    maxParticipants:     parsed.data.maxParticipants,
    totalRounds:         parsed.data.totalRounds,
    startDate:           parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
    courtManagement:     parsed.data.courtManagement,
    matchFormat:         parsed.data.matchFormat,
    scoringSystem:       parsed.data.scoringSystem,
    pointsWin:           parsed.data.pointsWin,
    pointsLoss:          parsed.data.pointsLoss,
    pointsWo:            parsed.data.pointsWo,
    gamificationEnabled: parsed.data.gamificationEnabled,
    xpPerWin:            parsed.data.xpPerWin,
    status:              "open",
    createdBy:           player.id,
    seasonId:            season?.id,
  }).returning();

  revalidatePath("/leagues");
  return league;
}

// ── Unirse con código de invitación ──────────────────────────────────────

export async function joinLeagueByCode(inviteCode: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const league = await db.query.leagues.findFirst({
    where: eq(leagues.inviteCode, inviteCode.toUpperCase()),
    with: { teams: true },
  });

  if (!league) throw new Error("Código de invitación inválido");
  if (league.status !== "open") throw new Error("Esta liga ya no admite inscripciones");

  if (league.teamFormat === "individual") {
    await db.insert(leagueIndividualRegistrations).values({
      leagueId: league.id,
      playerId:  player.id,
    }).onConflictDoNothing();
    revalidatePath(`/leagues/${league.id}`);
  }

  return league;
}

// ── Inscripción individual (parejas variables) ────────────────────────────

export async function joinLeagueIndividual(leagueId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const league = await db.query.leagues.findFirst({ where: eq(leagues.id, leagueId) });
  if (!league) throw new Error("Liga no encontrada");
  if (league.teamFormat !== "individual") throw new Error("Esta liga es de parejas fijas");
  if (league.status !== "open") throw new Error("La liga ya no admite inscripciones");

  await db.insert(leagueIndividualRegistrations).values({
    leagueId,
    playerId: player.id,
  }).onConflictDoNothing();

  revalidatePath(`/leagues/${leagueId}`);
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
    type:         "league_invite",
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
      type:         "friend_accepted",
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

  let teamIds: string[] = [];

  if (league.teamFormat === "fixed_pairs") {
    if ((league.teams?.length ?? 0) < 3) throw new Error("Mínimo 3 parejas para iniciar");
    teamIds = (league.teams ?? []).map((t) => t.id);
  } else {
    // Parejas variables: obtener inscritos y generar equipos por ELO
    const registrations = await db.query.leagueIndividualRegistrations.findMany({
      where: eq(leagueIndividualRegistrations.leagueId, leagueId),
      with:  { player: true },
    });

    if (registrations.length < 4) throw new Error("Mínimo 4 jugadores individuales para iniciar");

    const playerData = registrations.map((r) => ({
      id:          r.player.id,
      elo:         r.player.elo,
      displayName: r.player.displayName,
    }));

    const pairings = generateVariablePairings(playerData);

    const insertedIds = await db.transaction(async (tx) => {
      const ids: string[] = [];
      for (const pair of pairings) {
        const p1 = playerData.find((p) => p.id === pair.team1[0]);
        const p2 = playerData.find((p) => p.id === pair.team1[1]);
        const p3 = playerData.find((p) => p.id === pair.team2[0]);
        const p4 = playerData.find((p) => p.id === pair.team2[1]);
        if (!p1 || !p2 || !p3 || !p4) continue;

        const [t1] = await tx.insert(leagueTeams).values({
          leagueId, player1Id: p1.id, player2Id: p2.id,
          name: `${p1.displayName.split(" ")[0]} & ${p2.displayName.split(" ")[0]}`,
          points: 0, wins: 0, losses: 0, setsWon: 0, setsLost: 0,
        }).returning();
        const [t2] = await tx.insert(leagueTeams).values({
          leagueId, player1Id: p3.id, player2Id: p4.id,
          name: `${p3.displayName.split(" ")[0]} & ${p4.displayName.split(" ")[0]}`,
          points: 0, wins: 0, losses: 0, setsWon: 0, setsLost: 0,
        }).returning();

        if (t1) ids.push(t1.id);
        if (t2) ids.push(t2.id);
      }
      return ids;
    });

    teamIds = insertedIds;
  }

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
    with:  { player1: true, player2: true },
  });

  for (const team of allTeams) {
    for (const p of [team.player1, team.player2]) {
      if (!p || p.id === player.id) continue;
      await db.insert(notifications).values({
        playerId:     p.id,
        type:         "match_registered",
        fromPlayerId: player.id,
        message:      `¡La liga "${league.name}" ha comenzado! ${calendar.length} jornadas generadas 🏆`,
      });
    }
  }

  revalidatePath(`/leagues/${leagueId}`);
}

// ── Introducir resultado (crea flujo post-partido) ────────────────────────

const MatchResultSchema = z.object({
  matchId:  z.string().uuid(),
  sets:     z.array(z.object({
    team1: z.number().min(0).max(7),
    team2: z.number().min(0).max(7),
  })).min(1).max(3),
  winnerId: z.string().uuid(),
});

export async function submitLeagueResult(input: z.infer<typeof MatchResultSchema>): Promise<{ flowId: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = MatchResultSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const { matchId, sets, winnerId } = parsed.data;

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("No autenticado");

  const match = await db.query.leagueMatches.findFirst({
    where: eq(leagueMatches.id, matchId),
    with: {
      league: true,
      team1:  { with: { player1: true, player2: true } },
      team2:  { with: { player1: true, player2: true } },
    },
  });

  if (!match) throw new Error("Partido no encontrado");
  if (match.winnerId) throw new Error("Este partido ya tiene resultado");
  if (!match.team1?.player1 || !match.team1?.player2 || !match.team2?.player1 || !match.team2?.player2) {
    throw new Error("Jugadores del partido no encontrados");
  }
  if (winnerId !== match.team1Id && winnerId !== match.team2Id) throw new Error("Ganador inválido");

  const allPlayerIds = [
    match.team1.player1.id, match.team1.player2.id,
    match.team2.player1.id, match.team2.player2.id,
  ];

  const isParticipant   = allPlayerIds.includes(player.id);
  const isLeagueCreator = match.league.createdBy === player.id;
  if (!isParticipant && !isLeagueCreator) throw new Error("No tienes permiso para subir este resultado");

  // Verificar que no existe ya un flujo para este partido
  const existing = await db.query.postmatchFlows.findFirst({
    where: and(
      eq(postmatchFlows.matchId, matchId),
      eq(postmatchFlows.matchType, "league")
    ),
  });
  if (existing) throw new Error("Ya existe un flujo de validación para este partido");

  const proposedWinner: "team1" | "team2" = winnerId === match.team1Id ? "team1" : "team2";
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let flowId = "";

  await db.transaction(async (tx) => {
    const [flow] = await tx.insert(postmatchFlows).values({
      matchId,
      matchType:        "league",
      status:           "pending_validation",
      createdBy:        player.id,
      proposedSets:     sets,
      proposedWinner,
      validationsCount: 1,
      expiresAt,
    }).returning();

    if (!flow) return;
    flowId = flow.id;

    for (const playerId of allPlayerIds) {
      await tx.insert(postmatchCompletions).values({
        flowId:    flow.id,
        playerId,
        validated: playerId === player.id,
      }).onConflictDoNothing();
    }

    for (const playerId of allPlayerIds.filter((id) => id !== player.id)) {
      await tx.insert(notifications).values({
        playerId,
        type:         "match_registered",
        fromPlayerId: player.id,
        flowId:       flow.id,
        message:      `${player.displayName} ha subido el resultado de vuestro partido. ¡Entra a validarlo! ⏱ 24h`,
      });
    }
  });

  revalidatePath(`/leagues/${match.leagueId}`);
  return { flowId };
}
