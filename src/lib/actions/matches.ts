"use server";

import { db } from "@db/index";
import { matches, players, postmatchFlows, postmatchCompletions, notifications } from "@db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
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


export async function createMatch(input: CreateMatchInput): Promise<{ flowId: string }> {
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
  const expiresAt  = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const allPlayerIds = [currentPlayer.id, partnerId, opponent1Id, opponent2Id];

  const [flow] = await db.transaction(async (tx) => {
    const [match] = await tx.insert(matches).values({
      venue,
      playedAt:       new Date(playedAt),
      team1Player1Id: currentPlayer.id,
      team1Player2Id: partnerId,
      team2Player1Id: opponent1Id,
      team2Player2Id: opponent2Id,
      winnerTeam,
      sets,
      createdBy:      currentPlayer.id,
      seasonId:       currentPlayer.seasonId,
    }).returning();

    if (!match) throw new Error("Error al crear el partido");

    const [flow] = await tx.insert(postmatchFlows).values({
      matchId:          match.id,
      matchType:        "regular",
      status:           "pending_validation",
      createdBy:        currentPlayer.id,
      proposedSets:     sets,
      proposedWinner:   winnerTeam,
      validationsCount: 1,
      expiresAt,
    }).returning();

    if (!flow) throw new Error("Error al crear el flujo postmatch");

    for (const playerId of allPlayerIds) {
      await tx.insert(postmatchCompletions).values({
        flowId:    flow.id,
        playerId,
        validated: playerId === currentPlayer.id,
      }).onConflictDoNothing();
    }

    for (const playerId of allPlayerIds.filter((id) => id !== currentPlayer.id)) {
      await tx.insert(notifications).values({
        playerId,
        type:         "match_registered",
        fromPlayerId: currentPlayer.id,
        flowId:       flow.id,
        message:      `${currentPlayer.displayName} ha subido el resultado de vuestro partido. ¡Entra a validarlo! ⏱ 24h`,
      });
    }

    return [flow];
  });

  return { flowId: flow!.id };
}
