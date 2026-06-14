const BASE_WIN_XP      = 100;
const BASE_LOSS_XP     = 40;
const XP_PER_LEVEL_BASE = 500;

export function calculateXpGain(
  playerElo: number,
  opponentAvgElo: number,
  won: boolean
): number {
  if (!won) return BASE_LOSS_XP;
  const eloDiff = opponentAvgElo - playerElo;
  const bonus   = Math.round(eloDiff * 0.2);
  return Math.min(200, Math.max(50, BASE_WIN_XP + bonus));
}

export function xpForLevel(level: number): number {
  return XP_PER_LEVEL_BASE * level + Math.round(XP_PER_LEVEL_BASE * 0.5 * (level - 1));
}

export function calculateLevel(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
} {
  let level       = 1;
  let accumulated = 0;

  while (true) {
    const needed = xpForLevel(level);
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
}
