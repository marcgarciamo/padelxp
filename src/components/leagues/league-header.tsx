import { TEAM_FORMAT_LABELS, MATCH_FORMAT_LABELS } from "@lib/league-utils";

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

  const teamCount = league.teams?.length ?? 0;
  const maxTeams  = league.teamFormat === "fixed_pairs"
    ? Math.floor((league.maxParticipants ?? 16) / 2)
    : (league.maxParticipants ?? 16);

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

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-muted)" }}>
        <span>👥 {teamCount}/{maxTeams} equipos</span>
        {league.teamFormat && TEAM_FORMAT_LABELS[league.teamFormat as string] && (
          <span>📋 {(TEAM_FORMAT_LABELS[league.teamFormat as string] ?? "").replace(/\(.*$/, "").trim()}</span>
        )}
        {league.matchFormat && MATCH_FORMAT_LABELS[league.matchFormat as string] && (
          <span>🎾 {MATCH_FORMAT_LABELS[league.matchFormat as string]}</span>
        )}
        <span>⚡ {league.xpPerWin} XP/victoria</span>
        {league.gamificationEnabled && <span>🌟 MVP activado</span>}
        {league.startDate && (
          <span>📅 Inicio: {new Date(league.startDate).toLocaleDateString("es-ES")}</span>
        )}
        {league.totalRounds > 0 && <span>📅 {league.totalRounds} jornadas</span>}
      </div>

      {myTeam && (
        <div style={{ marginTop: "10px", padding: "8px 12px", background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.3)", borderRadius: "8px", fontSize: "12px", color: "var(--accent-light)" }}>
          Tu equipo: <strong>{myTeam.name}</strong>
          {isCreator && " · Eres el creador"}
        </div>
      )}

      {isCreator && league.inviteCode && (
        <div style={{ marginTop: "10px", padding: "10px 12px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px" }}>
          <div style={{ fontSize: "11px", color: "var(--gold)", marginBottom: "3px" }}>Código de invitación</div>
          <div style={{ fontFamily: "monospace", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.2em" }}>
            {league.inviteCode}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            Comparte este código para que otros puedan unirse
          </div>
        </div>
      )}
    </div>
  );
}
