import type { StandingRow } from "@lib/league-engine";

interface Props {
  standings: StandingRow[];
  myTeamId?: string | undefined;
}

export function LeagueStandings({ standings, myTeamId }: Props) {
  if (standings.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "13px" }}>
        La clasificación aparecerá cuando empiece la liga.
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 32px 32px 32px 32px 36px", gap: "4px", padding: "0 12px 6px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        <span>#</span>
        <span>Equipo</span>
        <span style={{ textAlign: "center" }}>PJ</span>
        <span style={{ textAlign: "center" }}>PG</span>
        <span style={{ textAlign: "center" }}>PP</span>
        <span style={{ textAlign: "center" }}>Sets</span>
        <span style={{ textAlign: "center" }}>Pts</span>
      </div>

      {standings.map((row, i) => {
        const isMe = row.teamId === myTeamId;
        return (
          <div
            key={row.teamId}
            className="card"
            style={{
              display:             "grid",
              gridTemplateColumns: "28px 1fr 32px 32px 32px 32px 36px",
              gap:                 "4px",
              padding:             "10px 12px",
              marginBottom:        "4px",
              alignItems:          "center",
              borderLeft:          isMe ? "3px solid var(--accent)" : undefined,
              background:          isMe ? "rgba(124,92,252,0.06)" : undefined,
            }}
          >
            <span style={{ fontSize: i < 3 ? "16px" : "13px", color: "var(--text-muted)", fontWeight: 500 }}>
              {i < 3 ? medals[i] : i + 1}
            </span>
            <div style={{ fontSize: "12px", fontWeight: 500 }}>
              {row.team1Name.split(" ")[0]} & {row.team2Name.split(" ")[0]}
            </div>
            <span style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>{row.played}</span>
            <span style={{ textAlign: "center", fontSize: "12px", color: "var(--green)" }}>{row.won}</span>
            <span style={{ textAlign: "center", fontSize: "12px", color: "var(--red)" }}>{row.lost}</span>
            <span style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)" }}>{row.setsWon}/{row.setsLost}</span>
            <span style={{ textAlign: "center", fontSize: "15px", fontWeight: 700, color: "var(--accent-light)" }}>{row.points}</span>
          </div>
        );
      })}
    </div>
  );
}
