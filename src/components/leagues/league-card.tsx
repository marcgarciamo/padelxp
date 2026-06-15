import Link from "next/link";

interface Props { league: any; isMyLeague?: boolean; }

export function LeagueCard({ league, isMyLeague }: Props) {
  const statusColor = league.status === "open" ? "var(--green)" : league.status === "in_progress" ? "var(--gold)" : "var(--text-muted)";
  const statusText  = league.status === "open" ? "Abierta" : league.status === "in_progress" ? "En curso" : "Finalizada";

  return (
    <Link href={`/leagues/${league.id}`} style={{ textDecoration: "none", display: "block", marginBottom: "8px" }}>
      <div className="card" style={{ padding: "14px", borderLeft: isMyLeague ? "3px solid var(--accent)" : undefined }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <div style={{ fontSize: "14px", fontWeight: 500 }}>{league.name}</div>
          <span style={{ fontSize: "10px", color: statusColor, background: statusColor + "18", border: `1px solid ${statusColor}30`, padding: "2px 8px", borderRadius: "20px" }}>
            {statusText}
          </span>
        </div>
        <div style={{ display: "flex", gap: "14px", fontSize: "11px", color: "var(--text-muted)" }}>
          <span>👥 {(league.teams ?? []).length} equipos</span>
          <span>📅 {league.totalRounds} jornadas</span>
          <span>⚡ {league.xpPerWin} XP/victoria</span>
        </div>
      </div>
    </Link>
  );
}
