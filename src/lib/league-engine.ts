export function generateRoundRobinDouble(teamIds: string[]): Array<{
  roundNumber: number;
  matches: Array<{ team1Id: string; team2Id: string }>;
}> {
  const n     = teamIds.length;
  const teams = [...teamIds];
  const rounds: Array<{ roundNumber: number; matches: Array<{ team1Id: string; team2Id: string }> }> = [];

  if (n % 2 !== 0) teams.push("BYE");
  const total = teams.length;
  const half  = total / 2;

  for (let round = 0; round < total - 1; round++) {
    const matchesInRound: Array<{ team1Id: string; team2Id: string }> = [];
    for (let i = 0; i < half; i++) {
      const t1 = teams[i];
      const t2 = teams[total - 1 - i];
      if (t1 && t2 && t1 !== "BYE" && t2 !== "BYE") {
        matchesInRound.push({ team1Id: t1, team2Id: t2 });
      }
    }
    if (matchesInRound.length > 0) {
      rounds.push({ roundNumber: round + 1, matches: matchesInRound });
    }
    const fixed = teams[0]!;
    const rest  = teams.slice(1);
    rest.unshift(rest.pop()!);
    teams.splice(0, total, fixed, ...rest);
  }

  const idaRounds = rounds.length;
  for (let i = 0; i < idaRounds; i++) {
    const idaRound = rounds[i];
    if (!idaRound) continue;
    rounds.push({
      roundNumber: idaRounds + i + 1,
      matches: idaRound.matches.map((m) => ({
        team1Id: m.team2Id,
        team2Id: m.team1Id,
      })),
    });
  }

  return rounds;
}

export interface StandingRow {
  teamId:    string;
  team1Name: string;
  team2Name: string;
  played:    number;
  won:       number;
  lost:      number;
  setsWon:   number;
  setsLost:  number;
  gamesWon:  number;
  gamesLost: number;
  points:    number;
  mvps:      number;
}

export function calculateStandings(
  teams: Array<{ id: string; player1: { displayName: string; mvpCount?: number }; player2: { displayName: string; mvpCount?: number } }>,
  completedMatches: Array<{
    team1Id:  string;
    team2Id:  string;
    winnerId: string | null | undefined;
    sets:     unknown;
  }>
): StandingRow[] {
  const map = new Map<string, StandingRow>();

  for (const team of teams) {
    map.set(team.id, {
      teamId:    team.id,
      team1Name: team.player1.displayName,
      team2Name: team.player2.displayName,
      played:    0, won: 0, lost: 0,
      setsWon:   0, setsLost: 0,
      gamesWon:  0, gamesLost: 0,
      points:    0,
      mvps:      (team.player1.mvpCount ?? 0) + (team.player2.mvpCount ?? 0),
    });
  }

  for (const match of completedMatches) {
    if (!match.winnerId) continue;
    const sets = (match.sets as Array<{ team1: number; team2: number }>) ?? [];

    const t1 = map.get(match.team1Id);
    const t2 = map.get(match.team2Id);
    if (!t1 || !t2) continue;

    t1.played++; t2.played++;

    let t1Sets = 0, t2Sets = 0, t1Games = 0, t2Games = 0;
    for (const s of sets) {
      if (s.team1 > s.team2) t1Sets++; else t2Sets++;
      t1Games += s.team1; t2Games += s.team2;
    }

    t1.setsWon  += t1Sets;  t1.setsLost  += t2Sets;
    t2.setsWon  += t2Sets;  t2.setsLost  += t1Sets;
    t1.gamesWon += t1Games; t1.gamesLost += t2Games;
    t2.gamesWon += t2Games; t2.gamesLost += t1Games;

    if (match.winnerId === match.team1Id) {
      t1.won++; t1.points += 3; t2.lost++;
    } else {
      t2.won++; t2.points += 3; t1.lost++;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aSetDiff = a.setsWon - a.setsLost;
    const bSetDiff = b.setsWon - b.setsLost;
    if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
    return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
  });
}
