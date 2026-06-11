import { getLeagueById } from "@lib/queries/tournaments";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Avatar } from "@components/player/avatar";
import { PageTransition } from "@components/ui/page-transition";

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Evitar que Drizzle intente buscar un UUID inválido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const league = await getLeagueById(id);
  if (!league) notFound();

  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        <div className="card-elevated" style={{ padding: "18px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 500 }}>{league.name}</h1>
              {league.description && <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{league.description}</p>}
            </div>
            <span className="badge-xp" style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
              🏆 {league.xpPerWin} XP / win
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
            <span>👥 {league.teams?.length ?? 0} equipos</span>
            <span>📅 {league.totalRounds} jornadas</span>
          </div>
        </div>

        <h2 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
          Clasificación
        </h2>

        <div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "24px" }}>
          <div style={{ display: "flex", padding: "12px 16px", background: "var(--bg-primary)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
            <div style={{ flex: 1 }}>Equipo</div>
            <div style={{ width: "30px", textAlign: "center" }}>PTS</div>
            <div style={{ width: "30px", textAlign: "center" }}>V</div>
            <div style={{ width: "30px", textAlign: "center" }}>D</div>
          </div>
          
          {(!league.teams || league.teams.length === 0) ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
              No hay equipos inscritos en esta liga.
            </div>
          ) : (
            league.teams.map((team, index) => (
              <div key={team.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)", background: index < 2 ? "rgba(124, 92, 252, 0.05)" : "transparent" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "20px", fontSize: "12px", fontWeight: 600, color: index === 0 ? "var(--accent)" : "var(--text-muted)" }}>
                    {index + 1}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>{team.name}</span>
                  </div>
                </div>
                <div style={{ width: "30px", textAlign: "center", fontSize: "14px", fontWeight: 600, color: "var(--accent)" }}>{team.points}</div>
                <div style={{ width: "30px", textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>{team.wins}</div>
                <div style={{ width: "30px", textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>{team.losses}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}
