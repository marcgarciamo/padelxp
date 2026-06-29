import { eloToGlobalRating } from "@lib/elo";

interface AttributeSet {
  attrAttack:      number;
  attrDefense:     number;
  attrVolley:      number;
  attrConsistency: number;
  attrBandeja:     number;
  attrRemate:      number;
}

const ATTR_MIN = 50;
const ATTR_MAX = 99;

export function calculateGlobalRating(attrs: AttributeSet): number {
  return Math.round(
    (attrs.attrAttack + attrs.attrDefense + attrs.attrVolley +
     attrs.attrConsistency + attrs.attrBandeja + attrs.attrRemate) / 6
  );
}

export function calculateAttributeGrowth(
  current:      AttributeSet,
  newElo:       number,
  won:          boolean,
  setsWon:      number,
  setsLost:     number,
  totalMatches: number,
): AttributeSet {
  const targetGlobal  = eloToGlobalRating(newElo);
  const currentGlobal = calculateGlobalRating(current);
  const globalDiff    = targetGlobal - currentGlobal;

  const speed    = totalMatches <= 5 ? 0.8 : totalMatches <= 20 ? 0.5 : 0.3;
  const baseMove = globalDiff * speed;

  const totalSets  = setsWon + setsLost;
  const setRatio   = totalSets > 0 ? setsWon / totalSets : 0.5;
  const isDominant = setRatio >= 0.75;

  function adjustAttr(val: number, weight: number): number {
    return Math.min(ATTR_MAX, Math.max(ATTR_MIN, Math.round(val + baseMove * weight)));
  }

  if (won) {
    return {
      attrAttack:      adjustAttr(current.attrAttack,      isDominant ? 1.2 : 0.7),
      attrDefense:     adjustAttr(current.attrDefense,     isDominant ? 0.5 : 1.2),
      attrVolley:      adjustAttr(current.attrVolley,      isDominant ? 1.0 : 0.6),
      attrConsistency: adjustAttr(current.attrConsistency, isDominant ? 0.3 : 1.0),
      attrBandeja:     adjustAttr(current.attrBandeja,     isDominant ? 0.8 : 1.0),
      attrRemate:      adjustAttr(current.attrRemate,      isDominant ? 1.0 : 0.5),
    };
  } else {
    return {
      attrAttack:      adjustAttr(current.attrAttack,      0.9),
      attrDefense:     adjustAttr(current.attrDefense,     0.9),
      attrVolley:      adjustAttr(current.attrVolley,      0.9),
      attrConsistency: adjustAttr(current.attrConsistency, 0.9),
      attrBandeja:     adjustAttr(current.attrBandeja,     0.9),
      attrRemate:      adjustAttr(current.attrRemate,      0.9),
    };
  }
}

export function getSetsForPlayer(
  sets:    Array<{ team1: number; team2: number }>,
  isTeam1: boolean
): { setsWon: number; setsLost: number } {
  let setsWon = 0, setsLost = 0;
  for (const s of sets) {
    const mine   = isTeam1 ? s.team1 : s.team2;
    const theirs = isTeam1 ? s.team2 : s.team1;
    if (mine > theirs) setsWon++;
    else setsLost++;
  }
  return { setsWon, setsLost };
}
