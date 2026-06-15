"use server";

import { db } from "@db/index";
import { mvpVotes, players, notifications } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";
import { getMatchMvpVotes, hasPlayerVoted } from "@lib/queries/mvp";

const VoteMvpSchema = z.object({
  matchId:        z.string().uuid(),
  matchType:      z.enum(["league", "tournament"]),
  nomineeId:      z.string().uuid(),
  team1Player1Id: z.string().uuid(),
  team1Player2Id: z.string().uuid(),
  team2Player1Id: z.string().uuid(),
  team2Player2Id: z.string().uuid(),
});

export async function voteMvp(input: z.infer<typeof VoteMvpSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const parsed = VoteMvpSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const { matchId, matchType, nomineeId,
    team1Player1Id, team1Player2Id,
    team2Player1Id, team2Player2Id } = parsed.data;

  const voter = await getPlayerByUserId(session.user.id);
  if (!voter) throw new Error("Jugador no encontrado");

  const allPlayers = [team1Player1Id, team1Player2Id, team2Player1Id, team2Player2Id];
  if (!allPlayers.includes(voter.id)) throw new Error("No participas en este partido");

  const isTeam1 = [team1Player1Id, team1Player2Id].includes(voter.id);
  const validNominees = isTeam1 ? [team2Player1Id, team2Player2Id] : [team1Player1Id, team1Player2Id];
  if (!validNominees.includes(nomineeId)) throw new Error("Solo puedes votar a un rival");

  const alreadyVoted = await hasPlayerVoted(matchId, matchType, voter.id);
  if (alreadyVoted) throw new Error("Ya has votado en este partido");

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(mvpVotes).values({ matchId, matchType, voterId: voter.id, nomineeId, confirmed: false, expiresAt });

  // Comprobar si se alcanza consenso (2+ votos rivales al mismo jugador)
  const allVotes = await getMatchMvpVotes(matchId, matchType);

  const voteCount = new Map<string, number>();
  for (const vote of allVotes) {
    const voterIsTeam1 = [team1Player1Id, team1Player2Id].includes(vote.voterId);
    const nomineeIsRival = voterIsTeam1
      ? [team2Player1Id, team2Player2Id].includes(vote.nomineeId)
      : [team1Player1Id, team1Player2Id].includes(vote.nomineeId);
    if (nomineeIsRival) {
      voteCount.set(vote.nomineeId, (voteCount.get(vote.nomineeId) ?? 0) + 1);
    }
  }

  const mvpId = [...voteCount.entries()].find(([, count]) => count >= 2)?.[0];

  if (mvpId) {
    await db.transaction(async (tx) => {
      await tx.update(mvpVotes).set({ confirmed: true })
        .where(and(eq(mvpVotes.matchId, matchId), eq(mvpVotes.matchType, matchType)));

      const mvpPlayer = await tx.query.players.findFirst({ where: eq(players.id, mvpId) });
      if (mvpPlayer) {
        await tx.update(players).set({
          xp:        mvpPlayer.xp + 50,
          mvpCount:  mvpPlayer.mvpCount + 1,
          updatedAt: new Date(),
        }).where(eq(players.id, mvpId));

        await tx.insert(notifications).values({
          playerId:     mvpId,
          type:         "achievement",
          fromPlayerId: voter.id,
          message:      `🌟 ¡Has sido elegido MVP del partido! +50 XP`,
        });
      }
    });
  }

  revalidatePath(`/leagues`);
  revalidatePath(`/tournaments`);

  return { voted: true, mvpFound: !!mvpId, mvpId: mvpId ?? null };
}
