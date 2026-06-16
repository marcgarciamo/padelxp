const MAX_LEVEL      = 50;
const BASE_XP_LEVEL  = 800;
const XP_GROWTH      = 1.15;

const BASE_WIN_XP    = 80;
const BASE_LOSS_XP   = 30;
const MAX_XP_PER_WIN = 200;

export function calculateXpGain(
  playerGlobalRating:  number,
  opponentAvgRating:   number,
  won:                 boolean
): number {
  if (!won) return BASE_LOSS_XP;
  const diff  = opponentAvgRating - playerGlobalRating;
  const bonus = Math.round(diff * 1.5);
  return Math.min(MAX_XP_PER_WIN, Math.max(BASE_WIN_XP, BASE_WIN_XP + bonus));
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.round(BASE_XP_LEVEL * Math.pow(XP_GROWTH, i - 1));
  }
  return total;
}

export function xpToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return Math.round(BASE_XP_LEVEL * Math.pow(XP_GROWTH, level - 1));
}

export function calculateLevel(totalXp: number): {
  level:         number;
  xpIntoLevel:   number;
  xpToNextLevel: number;
} {
  let level       = 1;
  let accumulated = 0;

  while (level < MAX_LEVEL) {
    const needed = xpToNextLevel(level);
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
    level:         MAX_LEVEL,
    xpIntoLevel:   totalXp - xpForLevel(MAX_LEVEL),
    xpToNextLevel: 0,
  };
}
