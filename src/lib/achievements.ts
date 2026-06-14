import { db } from "@db/index";
import { achievements, players } from "@db/schema";
import { desc } from "drizzle-orm";

type AchievementType =
  | "first_win" | "win_streak_3" | "win_streak_5" | "win_streak_10"
  | "top_3_ranking" | "level_10" | "level_25" | "comeback_win"
  | "volley_master" | "consistent_player" | "century_matches";

interface PlayerStats {
  id:              string;
  totalWins:       number;
  winStreak:       number;
  level:           number;
  attrVolley:      number;
  attrConsistency: number;
  seasonId:        string | null | undefined;
}

export async function evaluateAndAwardAchievements(
  player:      PlayerStats,
  isComeback:  boolean = false
): Promise<AchievementType[]> {
  const toAward: AchievementType[] = [];

  if (player.totalWins === 1)          toAward.push("first_win");
  if (player.winStreak >= 3)           toAward.push("win_streak_3");
  if (player.winStreak >= 5)           toAward.push("win_streak_5");
  if (player.winStreak >= 10)          toAward.push("win_streak_10");
  if (player.level >= 10)              toAward.push("level_10");
  if (player.level >= 25)              toAward.push("level_25");
  if (player.attrVolley >= 85)         toAward.push("volley_master");
  if (player.attrConsistency >= 85)    toAward.push("consistent_player");
  if (player.totalWins >= 100)         toAward.push("century_matches");
  if (isComeback)                      toAward.push("comeback_win");

  const topPlayers = await db.query.players.findMany({
    orderBy: [desc(players.elo)],
    limit: 3,
    columns: { id: true },
  });
  if (topPlayers.some((p) => p.id === player.id)) {
    toAward.push("top_3_ranking");
  }

  const awarded: AchievementType[] = [];
  for (const type of toAward) {
    try {
      await db.insert(achievements).values({
        playerId: player.id,
        type,
        seasonId: player.seasonId ?? undefined,
      }).onConflictDoNothing();
      awarded.push(type);
    } catch {}
  }

  return awarded;
}
