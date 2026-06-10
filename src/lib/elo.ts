const K = 32;

export function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

export function calculateElo(
  playerElo: number,
  opponentElo: number,
  won: boolean
): { newElo: number; delta: number } {
  const expected = expectedScore(playerElo, opponentElo);
  const actual   = won ? 1 : 0;
  const delta    = Math.round(K * (actual - expected));
  return { newElo: playerElo + delta, delta };
}

export function calculateTeamElo(
  team1Elos: [number, number],
  team2Elos: [number, number],
  team1Won: boolean
): {
  team1Deltas: [number, number];
  team2Deltas: [number, number];
} {
  const team1Avg = Math.round((team1Elos[0] + team1Elos[1]) / 2);
  const team2Avg = Math.round((team2Elos[0] + team2Elos[1]) / 2);

  const p1 = calculateElo(team1Elos[0], team2Avg, team1Won);
  const p2 = calculateElo(team1Elos[1], team2Avg, team1Won);
  const p3 = calculateElo(team2Elos[0], team1Avg, !team1Won);
  const p4 = calculateElo(team2Elos[1], team1Avg, !team1Won);

  return {
    team1Deltas: [p1.delta, p2.delta],
    team2Deltas: [p3.delta, p4.delta],
  };
}
