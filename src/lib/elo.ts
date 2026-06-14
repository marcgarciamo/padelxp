const K = 32;

export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

export function calculateElo(
  playerElo: number,
  opponentElo: number,
  won: boolean
): { newElo: number; delta: number } {
  const expected = expectedScore(playerElo, opponentElo);
  const actual   = won ? 1 : 0;
  const delta    = Math.round(K * (actual - expected));
  const newElo   = Math.max(100, playerElo + delta);
  return { newElo, delta };
}

export function calculateMatchElo(
  team1: [number, number],
  team2: [number, number],
  team1Won: boolean
): {
  team1: [{ newElo: number; delta: number }, { newElo: number; delta: number }];
  team2: [{ newElo: number; delta: number }, { newElo: number; delta: number }];
} {
  const team1Avg = Math.round((team1[0] + team1[1]) / 2);
  const team2Avg = Math.round((team2[0] + team2[1]) / 2);

  return {
    team1: [
      calculateElo(team1[0], team2Avg, team1Won),
      calculateElo(team1[1], team2Avg, team1Won),
    ],
    team2: [
      calculateElo(team2[0], team1Avg, !team1Won),
      calculateElo(team2[1], team1Avg, !team1Won),
    ],
  };
}
