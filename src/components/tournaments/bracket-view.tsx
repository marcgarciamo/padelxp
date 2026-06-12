"use client";

import { type TournamentRound, type TournamentMatch, type TournamentTeam } from "@db/schema";
import { ReportMatchModal } from "./report-match-modal";

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
  isCreator: boolean;
}

export function BracketView({ rounds, isCreator }: Props) {
  // Ordenar rondas por número
  const sortedRounds = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);

  return (
    <div style={{ marginTop: "24px" }}>
      <h2 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
        Cuadro del Torneo
      </h2>
      
      <div style={{ 
        display: "flex", 
        gap: "32px", 
        overflowX: "auto", 
        paddingBottom: "24px", 
        paddingTop: "8px",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch"
      }}>
        {sortedRounds.map((round) => (
          <div key={round.id} style={{ 
            minWidth: "200px", 
            flexShrink: 0, 
            display: "flex", 
            flexDirection: "column",
            scrollSnapAlign: "start"
          }}>
            <h3 style={{ 
              fontSize: "11px", 
              color: "var(--accent)", 
              background: "rgba(124, 92, 252, 0.1)",
              padding: "4px 12px",
              borderRadius: "20px",
              textTransform: "uppercase", 
              letterSpacing: "0.05em", 
              marginBottom: "20px", 
              textAlign: "center",
              fontWeight: 700,
              width: "fit-content",
              marginInline: "auto"
            }}>
              {round.name}
            </h3>
            
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "space-around", 
              flexGrow: 1,
              gap: "24px",
              position: "relative"
            }}>
              {round.matches.map((match) => {
                const isPending = match.team1Id && match.team2Id && !match.winnerId;
                const hasWinner = !!match.winnerId;
                
                return (
                  <div key={match.id} style={{ position: "relative" }}>
                    <div className="card-elevated" style={{ 
                      padding: "0", 
                      borderRadius: "12px", 
                      border: isPending ? "1px solid var(--accent)" : "1px solid var(--border)",
                      overflow: "hidden",
                      boxShadow: isPending ? "0 0 15px rgba(124, 92, 252, 0.2)" : "none",
                      background: "var(--bg-surface)"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {/* Equipo 1 */}
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          padding: "12px 14px",
                          fontSize: "13px",
                          background: match.winnerId === match.team1Id ? "rgba(34, 197, 94, 0.1)" : "transparent",
                          color: match.winnerId === match.team1Id ? "var(--green)" : hasWinner ? "var(--text-muted)" : "var(--text-primary)",
                          fontWeight: match.winnerId === match.team1Id ? 600 : 400
                        }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {match.team1?.name ?? (round.roundNumber === 1 ? "BYE" : "TBD")}
                          </span>
                          {match.winnerId === match.team1Id && <span style={{ fontSize: "14px" }}>🏆</span>}
                        </div>
                        
                        <div style={{ height: "1px", background: "var(--border)" }} />
                        
                        {/* Equipo 2 */}
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          padding: "12px 14px",
                          fontSize: "13px",
                          background: match.winnerId === match.team2Id ? "rgba(34, 197, 94, 0.1)" : "transparent",
                          color: match.winnerId === match.team2Id ? "var(--green)" : hasWinner ? "var(--text-muted)" : "var(--text-primary)",
                          fontWeight: match.winnerId === match.team2Id ? 600 : 400
                        }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {match.team2?.name ?? (round.roundNumber === 1 ? "BYE" : "TBD")}
                          </span>
                          {match.winnerId === match.team2Id && <span style={{ fontSize: "14px" }}>🏆</span>}
                        </div>
                      </div>
                    </div>

                    {isCreator && isPending && match.team1 && match.team2 && (
                      <ReportMatchModal matchId={match.id} team1={match.team1} team2={match.team2} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
