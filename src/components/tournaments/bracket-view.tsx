import { type TournamentRound, type TournamentMatch, type TournamentTeam } from "@db/schema";

interface MatchWithTeams extends TournamentMatch {
  team1: TournamentTeam | null;
  team2: TournamentTeam | null;
  winner: TournamentTeam | null;
}

interface RoundWithMatches extends TournamentRound {
  matches: MatchWithTeams[];
}

interface Props {
  rounds: RoundWithMatches[];
}

export function BracketView({ rounds }: Props) {
  // Ordenar rondas por número
  const sortedRounds = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);

  return (
    <div style={{ display: "flex", gap: "24px", overflowX: "auto", paddingBottom: "16px", marginTop: "16px" }}>
      {sortedRounds.map((round) => (
        <div key={round.id} style={{ minWidth: "180px", flexShrink: 0 }}>
          <h3 style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px", textAlign: "center" }}>
            {round.name}
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", height: "100%", gap: "16px" }}>
            {round.matches.map((match) => (
              <div key={match.id} className="card" style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {/* Equipo 1 */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    fontSize: "12px",
                    color: match.winnerId === match.team1Id && match.team1Id ? "var(--green)" : "inherit",
                    fontWeight: match.winnerId === match.team1Id && match.team1Id ? 600 : 400
                  }}>
                    <span>{match.team1?.name ?? "BYE"}</span>
                    {match.winnerId === match.team1Id && match.team1Id && <span>✓</span>}
                  </div>
                  
                  <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                  
                  {/* Equipo 2 */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    fontSize: "12px",
                    color: match.winnerId === match.team2Id && match.team2Id ? "var(--green)" : "inherit",
                    fontWeight: match.winnerId === match.team2Id && match.team2Id ? 600 : 400
                  }}>
                    <span>{match.team2?.name ?? "BYE"}</span>
                    {match.winnerId === match.team2Id && match.team2Id && <span>✓</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
