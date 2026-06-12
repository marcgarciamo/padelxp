const BASE_WIN_XP  = 100;
const BASE_LOSS_XP = 40;
const XP_PER_LEVEL = 400; // xp necesario aumenta por nivel

export function calculateXpGain(
  playerElo: number,
  opponentAvgElo: number,
  won: boolean
): number {
  if (!won) return BASE_LOSS_XP;
  const bonus = Math.round((opponentAvgElo - playerElo) * 0.15);
  return Math.max(BASE_WIN_XP + bonus, BASE_LOSS_XP);
}

export function xpThresholdForLevel(level: number): number {
  return level * XP_PER_LEVEL + (level - 1) * 200;
}

export function calculateLevel(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
} {
  const MAX_LEVEL = 999;
  let level = 1;
  let accumulated = 0;
  while (level < MAX_LEVEL) {
    const needed = xpThresholdForLevel(level);
    if (accumulated + needed > totalXp) {
      return {
        level,
        xpIntoLevel:   totalXp - accumulated,
        xpToNextLevel: needed,
      };
    }
    accumulated += needed;
    level++;
  }
  return {
    level: MAX_LEVEL,
    xpIntoLevel: totalXp - accumulated,
    xpToNextLevel: xpThresholdForLevel(MAX_LEVEL),
  };
}
