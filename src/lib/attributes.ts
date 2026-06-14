interface AttributeUpdate {
  attrAttack:      number;
  attrDefense:     number;
  attrVolley:      number;
  attrConsistency: number;
}

export function calculateAttributeGrowth(
  current:      AttributeUpdate,
  won:          boolean,
  setsWon:      number,
  setsLost:     number,
  totalMatches: number
): AttributeUpdate {
  if (!won) return current;

  const growthFactor = totalMatches <= 10 ? 2 : totalMatches <= 30 ? 1 : 0.5;

  const totalSets = setsWon + setsLost;
  const setRatio  = totalSets > 0 ? setsWon / totalSets : 0.5;

  const isDominant = setRatio >= 0.8;

  function grow(val: number, weight: number): number {
    const increase = Math.round(growthFactor * weight * setRatio * 10) / 10;
    return Math.min(99, val + increase);
  }

  return {
    attrAttack:      grow(current.attrAttack,      isDominant ? 1.0 : 0.4),
    attrDefense:     grow(current.attrDefense,     isDominant ? 0.3 : 1.0),
    attrVolley:      grow(current.attrVolley,      isDominant ? 0.8 : 0.5),
    attrConsistency: grow(current.attrConsistency, isDominant ? 0.2 : 0.9),
  };
}

export function getSetsForPlayer(
  sets:    Array<{ team1: number; team2: number }>,
  isTeam1: boolean
): { setsWon: number; setsLost: number } {
  let setsWon  = 0;
  let setsLost = 0;
  for (const s of sets) {
    const playerScore   = isTeam1 ? s.team1 : s.team2;
    const opponentScore = isTeam1 ? s.team2 : s.team1;
    if (playerScore > opponentScore) setsWon++;
    else setsLost++;
  }
  return { setsWon, setsLost };
}
