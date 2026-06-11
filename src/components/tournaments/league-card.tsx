import Link from "next/link";
import { type League } from "@db/schema";

interface Props {
  league: League & { teams?: any[] };
}

export function LeagueCard({ league }: Props) {
  const teamCount = league.teams?.length ?? 0;

  return (
    <Link
      href={`/leagues/${league.id}`}
      className="card"
      style={{
        padding:         "16px",
        marginBottom:    "12px",
        display:         "block",
        textDecoration:  "none",
        color:           "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 600 }}>{league.name}</h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Liga por jornadas
          </p>
        </div>
        <span className="badge-xp" style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px" }}>
          {league.xpPerWin} XP / win
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>👥</span>
          <span>{teamCount} equipos</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>📅</span>
          <span>{league.totalRounds} jornadas</span>
        </div>
      </div>
    </Link>
  );
}
