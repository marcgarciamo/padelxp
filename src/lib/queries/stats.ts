import { db } from "@db/index";
import { eloHistory, matches, players } from "@db/schema";
import { eq, desc, or, sql } from "drizzle-orm";

export async function getEloHistory(playerId: string, limit = 30) {
  return db.query.eloHistory.findMany({
    where: eq(eloHistory.playerId, playerId),
    orderBy: [desc(eloHistory.recordedAt)],
    limit,
  });
}

export async function getAdvancedStats(playerId: string) {
  const playerMatches = await db.query.matches.findMany({
    where: or(
      eq(matches.team1Player1Id, playerId),
      eq(matches.team1Player2Id, playerId),
      eq(matches.team2Player1Id, playerId),
      eq(matches.team2Player2Id, playerId),
    ),
    orderBy: [desc(matches.playedAt)],
    limit: 200,
    with: {
      team1Player1: true,
      team1Player2: true,
      team2Player1: true,
      team2Player2: true,
    },
  });

  const partnerWins: Record<
    string,
    { name: string; wins: number; total: number }
  > = {};
  const rivalCount: Record<string, { name: string; count: number; wins: number }> =
    {};

  let maxStreak = 0;
  let currentStreak = 0;
  let totalSetsWon = 0;
  let totalSetsLost = 0;

  for (const m of playerMatches) {
    const isTeam1 = [m.team1Player1Id, m.team1Player2Id].includes(playerId);
    const won = isTeam1 ? m.winnerTeam === "team1" : m.winnerTeam === "team2";

    if (won) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }

    const sets = m.sets as Array<{ team1: number; team2: number }>;
    for (const s of sets) {
      if (isTeam1) {
        totalSetsWon += s.team1 > s.team2 ? 1 : 0;
        totalSetsLost += s.team2 > s.team1 ? 1 : 0;
      } else {
        totalSetsWon += s.team2 > s.team1 ? 1 : 0;
        totalSetsLost += s.team1 > s.team2 ? 1 : 0;
      }
    }

    const partnerId = isTeam1
      ? m.team1Player1Id === playerId
        ? m.team1Player2Id
        : m.team1Player1Id
      : m.team2Player1Id === playerId
        ? m.team2Player2Id
        : m.team2Player1Id;
    const partnerName = isTeam1
      ? m.team1Player1Id === playerId
        ? m.team1Player2.displayName
        : m.team1Player1.displayName
      : m.team2Player1Id === playerId
        ? m.team2Player2.displayName
        : m.team2Player1.displayName;

    if (!partnerWins[partnerId]) {
      partnerWins[partnerId] = { name: partnerName, wins: 0, total: 0 };
    }
    partnerWins[partnerId]!.total++;
    if (won) partnerWins[partnerId]!.wins++;

    const rivals = isTeam1
      ? [m.team2Player1Id, m.team2Player2Id]
      : [m.team1Player1Id, m.team1Player2Id];
    const rivalNames = isTeam1
      ? [m.team2Player1.displayName, m.team2Player2.displayName]
      : [m.team1Player1.displayName, m.team1Player2.displayName];

    for (let i = 0; i < rivals.length; i++) {
      const rid = rivals[i]!;
      const rname = rivalNames[i]!;
      if (!rivalCount[rid]) rivalCount[rid] = { name: rname, count: 0, wins: 0 };
      rivalCount[rid]!.count++;
      if (won) rivalCount[rid]!.wins++;
    }
  }

  const bestPartner = Object.values(partnerWins)
    .filter((p) => p.total >= 2)
    .sort((a, b) => b.wins / b.total - (a.wins / a.total))[0] ?? null;

  const topRival = Object.values(rivalCount).sort(
    (a, b) => b.count - a.count
  )[0] ?? null;

  const last5 = playerMatches.slice(0, 5).map((m) => {
    const isTeam1 = [m.team1Player1Id, m.team1Player2Id].includes(playerId);
    return isTeam1 ? m.winnerTeam === "team1" : m.winnerTeam === "team2";
  });

  return {
    maxStreak,
    totalSetsWon,
    totalSetsLost,
    setWinRate:
      totalSetsWon + totalSetsLost > 0
        ? Math.round((totalSetsWon / (totalSetsWon + totalSetsLost)) * 100)
        : 0,
    bestPartner,
    topRival,
    last5Results: last5,
    totalMatches: playerMatches.length,
  };
}
