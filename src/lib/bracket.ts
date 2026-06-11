/**
 * Genera el bracket de eliminatoria para N equipos.
 * Rellena con "BYE" si N no es potencia de 2.
 * Devuelve array de rondas, cada una con sus enfrentamientos.
 */
export function generateEliminationBracket(teamIds: string[]): Array<{
  roundNumber: number;
  name:        string;
  matches:     Array<{ team1Id: string | null; team2Id: string | null; position: number }>;
}> {
  const ROUND_NAMES: Record<number, string> = {
    2: "Final",
    4: "Semifinal",
    8: "Cuartos de final",
    16: "Octavos de final",
    32: "Dieciseisavos",
  };

  // Redondear al siguiente potencia de 2
  let size = 1;
  while (size < teamIds.length) size *= 2;

  // Rellenar con BYEs
  const padded = [...teamIds];
  while (padded.length < size) padded.push("BYE");

  const rounds: any[] = [];
  let currentPairs = padded;
  let roundNumber  = 1;

  // Primera ronda — usar los equipos reales
  const firstRound = {
    roundNumber: 1,
    name:        ROUND_NAMES[size] ?? `Ronda ${roundNumber}`,
    matches:     [] as any[],
  };

  for (let i = 0; i < currentPairs.length; i += 2) {
    firstRound.matches.push({
      team1Id:  currentPairs[i] === "BYE" ? null : (currentPairs[i] ?? null),
      team2Id:  currentPairs[i + 1] === "BYE" ? null : (currentPairs[i + 1] ?? null),
      position: i / 2,
    });
  }
  rounds.push(firstRound);

  // Rondas siguientes — posiciones vacías (se rellenan con ganadores)
  let matchesInRound = size / 4;
  roundNumber++;
  while (matchesInRound >= 1) {
    const round = {
      roundNumber,
      name:    ROUND_NAMES[matchesInRound * 2] ?? `Ronda ${roundNumber}`,
      matches: [] as any[],
    };
    for (let i = 0; i < matchesInRound; i++) {
      round.matches.push({ team1Id: null, team2Id: null, position: i });
    }
    rounds.push(round);
    matchesInRound = Math.floor(matchesInRound / 2);
    roundNumber++;
  }

  return rounds;
}

/**
 * Calcula los puntos de liga (3 por victoria, 1 por empate, 0 por derrota)
 */
export function calculateLeaguePoints(
  sets: Array<{ team1: number; team2: number }>
): { team1Points: number; team2Points: number; team1Sets: number; team2Sets: number } {
  let team1Sets = 0;
  let team2Sets = 0;
  for (const s of sets) {
    if (s.team1 > s.team2) team1Sets++;
    else team2Sets++;
  }
  return {
    team1Points: team1Sets > team2Sets ? 3 : team1Sets === team2Sets ? 1 : 0,
    team2Points: team2Sets > team1Sets ? 3 : team1Sets === team2Sets ? 1 : 0,
    team1Sets,
    team2Sets,
  };
}
