"use client";

import { useState } from "react";
import { SubmitResultForm } from "./submit-result-form";

interface Props {
  rounds:    any[];
  isCreator: boolean;
  leagueId:  string;
}

export function LeagueRoundsList({ rounds, isCreator, leagueId }: Props) {
  const [openRound, setOpenRound] = useState<number | null>(
    rounds.find((r) => !r.completed)?.roundNumber ?? null
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {rounds.map((round) => (
        <div key={round.id} className="card" style={{ overflow: "hidden" }}>
          <div
            onClick={() => setOpenRound(openRound === round.roundNumber ? null : round.roundNumber)}
            style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500 }}>Jornada {round.roundNumber}</span>
              {round.completed && (
                <span style={{ fontSize: "10px", background: "var(--green-dim)", color: "var(--green)", padding: "2px 8px", borderRadius: "20px" }}>
                  Completada
                </span>
              )}
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
              {(round.matches ?? []).filter((m: any) => m.winnerId).length}/{(round.matches ?? []).length} jugados
              {openRound === round.roundNumber ? " ▲" : " ▼"}
            </span>
          </div>

          {openRound === round.roundNumber && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {(round.matches ?? []).map((m: any) => (
                <div key={m.id} style={{ padding: "10px", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: m.winnerId ? 0 : "10px" }}>
                    <span style={{ flex: 1, fontSize: "12px", fontWeight: 500, color: m.winnerId === m.team1Id ? "var(--green)" : "var(--text-primary)" }}>
                      {m.team1?.player1?.displayName?.split(" ")[0]} & {m.team1?.player2?.displayName?.split(" ")[0]}
                    </span>
                    {m.winnerId ? (
                      <div style={{ display: "flex", gap: "4px" }}>
                        {(m.sets as any[] ?? []).map((s: any, i: number) => (
                          <span key={i} style={{ fontSize: "12px", fontWeight: 600 }}>{s.team1}–{s.team2}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", padding: "2px 8px", background: "var(--bg-primary)", borderRadius: "20px" }}>
                        Pendiente
                      </span>
                    )}
                    <span style={{ flex: 1, fontSize: "12px", fontWeight: 500, textAlign: "right", color: m.winnerId === m.team2Id ? "var(--green)" : "var(--text-primary)" }}>
                      {m.team2?.player1?.displayName?.split(" ")[0]} & {m.team2?.player2?.displayName?.split(" ")[0]}
                    </span>
                  </div>
                  {!m.winnerId && isCreator && (
                    <SubmitResultForm
                      matchId={m.id}
                      team1Id={m.team1Id}
                      team2Id={m.team2Id}
                      team1Name={`${m.team1?.player1?.displayName?.split(" ")[0]} & ${m.team1?.player2?.displayName?.split(" ")[0]}`}
                      team2Name={`${m.team2?.player1?.displayName?.split(" ")[0]} & ${m.team2?.player2?.displayName?.split(" ")[0]}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
