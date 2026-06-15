interface LeagueHeaderProps {
  league:    any;
  myTeam:    any;
  isCreator: boolean;
}

export function LeagueHeader({ league, myTeam, isCreator }: LeagueHeaderProps) {
  const statusLabel = ({
    open:        { text: "Inscripciones abiertas", color: "var(--green)" },
    in_progress: { text: "En curso",               color: "var(--gold)" },
    finished:    { text: "Finalizada",             color: "var(--text-muted)" },
  } as Record<string, { text: string; color: string }>)[league.status as string]
    ?? { text: league.status, color: "var(--text-muted)" };

  return (
    <div className="card-elevated" style={{ padding: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600 }}>{league.name}</h1>
        <span style={{ fontSize: "11px", color: statusLabel.color, background: statusLabel.color + "18", border: `1px solid ${statusLabel.color}30`, padding: "2px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
          {statusLabel.text}
        </span>
      </div>
      {league.description && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>{league.description}</p>
      )}
      <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
        <span>👥 {league.teams?.length ?? 0} equipos</span>
        <span>📅 {league.totalRounds} jornadas</span>
        <span>⚡ {league.xpPerWin} XP por victoria</span>
      </div>
      {myTeam && (
        <div style={{ marginTop: "10px", padding: "8px 12px", background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.3)", borderRadius: "8px", fontSize: "12px", color: "var(--accent-light)" }}>
          Tu equipo: <strong>{myTeam.name}</strong>
          {isCreator && " · Eres el creador"}
        </div>
      )}
    </div>
  );
}
