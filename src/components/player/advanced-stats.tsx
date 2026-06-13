interface AdvancedStatsProps {
  stats: {
    maxStreak: number;
    totalSetsWon: number;
    totalSetsLost: number;
    setWinRate: number;
    bestPartner: { name: string; wins: number; total: number } | null;
    topRival: { name: string; count: number; wins: number } | null;
    last5Results: boolean[];
    totalMatches: number;
  };
}

export function AdvancedStats({ stats }: AdvancedStatsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div className="card" style={{ padding: "12px 14px" }}>
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginBottom: "8px",
          }}
        >
          ÚLTIMOS 5 PARTIDOS
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {stats.last5Results.length === 0 ? (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Sin partidos aún
            </span>
          ) : (
            stats.last5Results.map((won, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: won ? "var(--green-dim)" : "var(--red-dim)",
                  border: won
                    ? "1px solid rgba(34,197,94,0.3)"
                    : "1px solid rgba(239,68,68,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: won ? "var(--green)" : "var(--red)",
                }}
              >
                {won ? "W" : "L"}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div className="card" style={{ padding: "12px 14px" }}>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginBottom: "4px",
            }}
          >
            RACHA MÁX.
          </div>
          <div style={{ fontSize: "22px", fontWeight: 500 }}>
            {stats.maxStreak}W
          </div>
        </div>
        <div className="card" style={{ padding: "12px 14px" }}>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginBottom: "4px",
            }}
          >
            WIN % SETS
          </div>
          <div style={{ fontSize: "22px", fontWeight: 500 }}>
            {stats.setWinRate}%
          </div>
        </div>
        <div className="card" style={{ padding: "12px 14px" }}>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginBottom: "4px",
            }}
          >
            SETS GANADOS
          </div>
          <div style={{ fontSize: "22px", fontWeight: 500 }}>
            {stats.totalSetsWon}
          </div>
        </div>
        <div className="card" style={{ padding: "12px 14px" }}>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginBottom: "4px",
            }}
          >
            TOTAL PARTIDOS
          </div>
          <div style={{ fontSize: "22px", fontWeight: 500 }}>
            {stats.totalMatches}
          </div>
        </div>
      </div>

      {stats.bestPartner && (
        <div
          className="card"
          style={{
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "24px" }}>🤝</span>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              MEJOR PAREJA
            </div>
            <div style={{ fontSize: "14px", fontWeight: 500 }}>
              {stats.bestPartner.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {stats.bestPartner.wins}V de {stats.bestPartner.total} juntos (
              {Math.round(
                (stats.bestPartner.wins / stats.bestPartner.total) * 100
              )}
              %)
            </div>
          </div>
        </div>
      )}

      {stats.topRival && (
        <div
          className="card"
          style={{
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "24px" }}>⚔️</span>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              RIVAL MÁS FRECUENTE
            </div>
            <div style={{ fontSize: "14px", fontWeight: 500 }}>
              {stats.topRival.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {stats.topRival.count} enfrentamientos · {stats.topRival.wins}V
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
