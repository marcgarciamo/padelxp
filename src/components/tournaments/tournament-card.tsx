import Link from "next/link";
import { type Tournament, type Player } from "@db/schema";

interface Props {
  tournament: Tournament & { teams?: any[]; creator?: Player };
}

export function TournamentCard({ tournament }: Props) {
  const teamCount = tournament.teams?.length ?? 0;

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="card"
      style={{
        padding:         "16px",
        marginBottom:    "12px",
        display:         "block",
        textDecoration:  "none",
        color:           "inherit",
        position:        "relative",
        overflow:        "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 600 }}>{tournament.name}</h3>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {tournament.format === "elimination" ? "🏆 Eliminatoria" : "📋 Todos contra todos"}
            </p>
            {tournament.creator && (
              <span style={{ fontSize: "10px", color: "var(--accent-light)", background: "var(--bg-primary)", padding: "1px 6px", borderRadius: "10px" }}>
                por @{tournament.creator.username}
              </span>
            )}
          </div>
        </div>
        <span className="badge-xp" style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px" }}>
          {tournament.xpReward} XP
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>👥</span>
          <span>{teamCount} / {tournament.maxTeams} equipos</span>
        </div>
        {tournament.startsAt && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>📅</span>
            <span>{new Date(tournament.startsAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Barra de progreso de llenado */}
      <div style={{ width: "100%", height: "4px", background: "var(--bg-primary)", borderRadius: "2px", marginTop: "12px" }}>
        <div style={{
          width:      `${(teamCount / tournament.maxTeams) * 100}%`,
          height:     "100%",
          background: "var(--accent)",
          borderRadius: "2px",
          transition: "width 0.3s ease",
        }} />
      </div>
    </Link>
  );
}
