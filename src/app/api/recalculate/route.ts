import { type NextRequest, NextResponse } from "next/server";
import { db } from "@db/index";
import { players, matches, eloHistory } from "@db/schema";
import { asc, eq } from "drizzle-orm";
import { calculateMatchElo } from "@lib/elo";
import { calculateXpGain, calculateLevel, xpToNextLevel } from "@lib/xp";
import { calculateAttributeGrowth, calculateGlobalRating, getSetsForPlayer } from "@lib/attributes";
import { evaluateAndAwardAchievements } from "@lib/achievements";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (!secret || secret !== process.env["RECALCULATE_SECRET"]) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Resetear todos los jugadores a estado inicial
    await db.update(players).set({
      elo:             1000,
      xp:              0,
      level:           1,
      xpToNextLevel:   xpToNextLevel(1),
      totalWins:       0,
      totalLosses:     0,
      winStreak:       0,
      attrAttack:      50,
      attrDefense:     50,
      attrVolley:      50,
      attrConsistency: 50,
    });

    // 2. Borrar elo_history existente
    await db.delete(eloHistory);

    // 3. Todos los partidos en orden cronológico
    const allMatches = await db.query.matches.findMany({
      orderBy: [asc(matches.playedAt)],
      with: {
        team1Player1: true,
        team1Player2: true,
        team2Player1: true,
        team2Player2: true,
      },
    });

    let processed = 0;

    for (const match of allMatches) {
      const { team1Player1: p1, team1Player2: p2, team2Player1: p3, team2Player2: p4 } = match;
      if (!p1 || !p2 || !p3 || !p4) continue;

      const team1Won = match.winnerTeam === "team1";
      const sets     = match.sets as Array<{ team1: number; team2: number }>;

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

      const p1Sets = getSetsForPlayer(sets, true);
      const p2Sets = getSetsForPlayer(sets, true);
      const p3Sets = getSetsForPlayer(sets, false);
      const p4Sets = getSetsForPlayer(sets, false);

      const p1Attrs = calculateAttributeGrowth({ attrAttack: p1.attrAttack, attrDefense: p1.attrDefense, attrVolley: p1.attrVolley, attrConsistency: p1.attrConsistency }, eloResult.team1[0]!.newElo, team1Won, p1Sets.setsWon, p1Sets.setsLost, p1.totalWins + p1.totalLosses + 1);
      const p2Attrs = calculateAttributeGrowth({ attrAttack: p2.attrAttack, attrDefense: p2.attrDefense, attrVolley: p2.attrVolley, attrConsistency: p2.attrConsistency }, eloResult.team1[1]!.newElo, team1Won, p2Sets.setsWon, p2Sets.setsLost, p2.totalWins + p2.totalLosses + 1);
      const p3Attrs = calculateAttributeGrowth({ attrAttack: p3.attrAttack, attrDefense: p3.attrDefense, attrVolley: p3.attrVolley, attrConsistency: p3.attrConsistency }, eloResult.team2[0]!.newElo, !team1Won, p3Sets.setsWon, p3Sets.setsLost, p3.totalWins + p3.totalLosses + 1);
      const p4Attrs = calculateAttributeGrowth({ attrAttack: p4.attrAttack, attrDefense: p4.attrDefense, attrVolley: p4.attrVolley, attrConsistency: p4.attrConsistency }, eloResult.team2[1]!.newElo, !team1Won, p4Sets.setsWon, p4Sets.setsLost, p4.totalWins + p4.totalLosses + 1);

      await db.transaction(async (tx) => {
        await tx.update(players).set({ elo: eloResult.team1[0]!.newElo, xp: p1.xp + team1Xp, level: p1Level.level, xpToNextLevel: p1Level.xpToNextLevel, totalWins: team1Won ? p1.totalWins + 1 : p1.totalWins, totalLosses: team1Won ? p1.totalLosses : p1.totalLosses + 1, winStreak: team1Won ? p1.winStreak + 1 : 0, ...p1Attrs, updatedAt: new Date() }).where(eq(players.id, p1.id));
        await tx.update(players).set({ elo: eloResult.team1[1]!.newElo, xp: p2.xp + team1Xp, level: p2Level.level, xpToNextLevel: p2Level.xpToNextLevel, totalWins: team1Won ? p2.totalWins + 1 : p2.totalWins, totalLosses: team1Won ? p2.totalLosses : p2.totalLosses + 1, winStreak: team1Won ? p2.winStreak + 1 : 0, ...p2Attrs, updatedAt: new Date() }).where(eq(players.id, p2.id));
        await tx.update(players).set({ elo: eloResult.team2[0]!.newElo, xp: p3.xp + team2Xp, level: p3Level.level, xpToNextLevel: p3Level.xpToNextLevel, totalWins: !team1Won ? p3.totalWins + 1 : p3.totalWins, totalLosses: !team1Won ? p3.totalLosses : p3.totalLosses + 1, winStreak: !team1Won ? p3.winStreak + 1 : 0, ...p3Attrs, updatedAt: new Date() }).where(eq(players.id, p3.id));
        await tx.update(players).set({ elo: eloResult.team2[1]!.newElo, xp: p4.xp + team2Xp, level: p4Level.level, xpToNextLevel: p4Level.xpToNextLevel, totalWins: !team1Won ? p4.totalWins + 1 : p4.totalWins, totalLosses: !team1Won ? p4.totalLosses : p4.totalLosses + 1, winStreak: !team1Won ? p4.winStreak + 1 : 0, ...p4Attrs, updatedAt: new Date() }).where(eq(players.id, p4.id));

        await tx.insert(eloHistory).values([
          { playerId: p1.id, elo: eloResult.team1[0]!.newElo, delta: eloResult.team1[0]!.delta, matchId: match.id },
          { playerId: p2.id, elo: eloResult.team1[1]!.newElo, delta: eloResult.team1[1]!.delta, matchId: match.id },
          { playerId: p3.id, elo: eloResult.team2[0]!.newElo, delta: eloResult.team2[0]!.delta, matchId: match.id },
          { playerId: p4.id, elo: eloResult.team2[1]!.newElo, delta: eloResult.team2[1]!.delta, matchId: match.id },
        ]);

        await tx.update(matches).set({
          team1EloDelta: eloResult.team1[0]!.delta,
          team2EloDelta: eloResult.team2[0]!.delta,
          team1XpGained: team1Xp,
          team2XpGained: team2Xp,
        }).where(eq(matches.id, match.id));
      });

      // Re-fetch para tener valores actualizados en el siguiente partido
      const [up1, up2, up3, up4] = await Promise.all([
        db.query.players.findFirst({ where: eq(players.id, p1.id) }),
        db.query.players.findFirst({ where: eq(players.id, p2.id) }),
        db.query.players.findFirst({ where: eq(players.id, p3.id) }),
        db.query.players.findFirst({ where: eq(players.id, p4.id) }),
      ]);

      const winnerP1 = team1Won ? up1 : up3;
      if (winnerP1) {
        await evaluateAndAwardAchievements({
          id:              winnerP1.id,
          totalWins:       winnerP1.totalWins,
          winStreak:       winnerP1.winStreak,
          level:           winnerP1.level,
          attrVolley:      winnerP1.attrVolley,
          attrConsistency: winnerP1.attrConsistency,
          seasonId:        winnerP1.seasonId,
        });
      }

      processed++;
    }

    return NextResponse.json({
      ok:      true,
      processed,
      message: `Recalculados ${processed} partidos correctamente`,
    });

  } catch (error) {
    console.error("Recalculate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
