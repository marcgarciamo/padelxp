import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getPlayerById, getPlayerByUserId } from "@lib/queries/players";
import { Avatar } from "@components/player/avatar";
import { XpProgressBar } from "@components/player/xp-progress-bar";
import { PageTransition } from "@components/ui/page-transition";
import { calculateLevel } from "@lib/xp";
import Link from "next/link";
import { db } from "@db/index";
import { seasonSnapshots } from "@db/schema";
import { eq, desc } from "drizzle-orm";

const ACHIEVEMENT_META: Record<string, { icon: string; label: string }> = {
  first_win:         { icon: "⭐", label: "Primera victoria" },
  win_streak_3:      { icon: "🔥", label: "Racha 3W" },
  win_streak_5:      { icon: "🔥", label: "Racha 5W" },
  win_streak_10:     { icon: "🔥", label: "Racha 10W" },
  top_3_ranking:     { icon: "🏅", label: "Top 3" },
  level_10:          { icon: "⚡", label: "Nivel 10" },
  level_25:          { icon: "💎", label: "Nivel 25" },
  comeback_win:      { icon: "↩️", label: "Comeback" },
  volley_master:     { icon: "🎾", label: "Volea Master" },
  consistent_player: { icon: "🎯", label: "Consistente" },
  century_matches:   { icon: "🏆", label: "100 partidos" },
};

const ALL_ACHIEVEMENTS = Object.keys(ACHIEVEMENT_META);

export default async function OtherProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Evitar error de UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [player, currentPlayer, playerSnapshots] = await Promise.all([
    getPlayerById(id),
    getPlayerByUserId(session.user.id),
    db.query.seasonSnapshots.findMany({
      where: eq(seasonSnapshots.playerId, id),
      with: { season: { columns: { name: true } } },
      orderBy: [desc(seasonSnapshots.createdAt)],
    }),
  ]);

  if (!player) notFound();

  // Si es mi propio perfil, redirigir a /profile
  if (currentPlayer && player.id === currentPlayer.id) {
    redirect("/profile");
  }

  const levelData = calculateLevel(player.xp);
  const earnedTypes = new Set(player.achievements.map((a) => a.type));
  const winRate = player.totalWins + player.totalLosses > 0
    ? Math.round((player.totalWins / (player.totalWins + player.totalLosses)) * 100)
    : 0;

  const attrs = [
    { name: "Ataque",       val: player.attrAttack,      color: "#ef4444" },
    { name: "Defensa",      val: player.attrDefense,     color: "#0ea5e9" },
    { name: "Volea",        val: player.attrVolley,      color: "#8b5cf6" },
    { name: "Consistencia", val: player.attrConsistency, color: "#22c55e" },
  ];

  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        {/* Hero */}
        <div className="card-elevated" style={{ padding: "18px", marginBottom: "14px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <Avatar name={player.displayName} src={player.avatarUrl} size={80} />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 500 }}>{player.displayName}</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>@{player.username}</div>
          {player.location && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>📍 {player.location}</div>}
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "8px" }}>
            <span className="badge-xp" style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>LV {player.level}</span>
            <span className="badge-xp" style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>{player.elo} ELO</span>
          </div>
          <div style={{ marginTop: "12px" }}>
            <XpProgressBar current={levelData.xpIntoLevel} total={levelData.xpToNextLevel} level={levelData.level} />
          </div>
        </div>

        {/* Atributos */}
        <h2 style={{ fontSize: "15px", fontWeight: 500, marginBottom: "10px" }}>Atributos</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
          {attrs.map((a) => (
            <div key={a.name} className="card" style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>{a.name}</div>
              <div style={{ fontSize: "20px", fontWeight: 500, marginBottom: "6px" }}>{a.val}</div>
              <div style={{ height: "4px", background: "var(--bg-elevated)", borderRadius: "2px" }}>
                <div style={{ height: "100%", width: `${a.val}%`, background: a.color, borderRadius: "2px", transition: "width 0.8s ease-out" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Logros */}
        <h2 style={{ fontSize: "15px", fontWeight: 500, marginBottom: "10px" }}>Logros</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px", marginBottom: "14px" }}>
          {ALL_ACHIEVEMENTS.map((type) => {
            const earned = earnedTypes.has(type as any);
            const meta   = ACHIEVEMENT_META[type];
            if (!meta) return null;
            return (
              <div
                key={type}
                className={earned ? "" : "card"}
                style={{
                  padding:    "10px 6px",
                  textAlign:  "center",
                  borderRadius: "10px",
                  fontSize:   "10px",
                  border:     earned ? "1px solid rgba(124,92,252,0.4)" : "1px solid var(--border)",
                  background: earned ? "rgba(124,92,252,0.08)" : "var(--bg-surface)",
                  color:      earned ? "var(--accent-light)" : "var(--text-hint)",
                }}
              >
                <div style={{ fontSize: "18px", marginBottom: "4px" }}>{meta.icon}</div>
                {meta.label}
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <h2 style={{ fontSize: "15px", fontWeight: 500, marginBottom: "10px" }}>Estadísticas</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "14px" }}>
          {[
            { val: player.totalWins + player.totalLosses, lbl: "Partidos" },
            { val: player.totalWins,                      lbl: "Victorias" },
            { val: `${winRate}%`,                         lbl: "Win %" },
            { val: `${player.winStreak}W`,                lbl: "Racha" },
          ].map((s) => (
            <div key={s.lbl} className="card" style={{ padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 500 }}>{s.val}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Historial de Temporadas */}
        {playerSnapshots.length > 0 && (
          <>
            <h2 style={{ fontSize: "15px", fontWeight: 500, marginBottom: "10px" }}>Historial de Temporadas</h2>
            <div className="card" style={{ overflow: "hidden", marginBottom: "14px" }}>
              {playerSnapshots.some((s) => (s.rankPosition ?? 99) <= 3) && (
                <div style={{ padding: "8px 14px", background: "rgba(234,179,8,0.08)", borderBottom: "1px solid var(--border)", fontSize: "11px", color: "#eab308" }}>
                  🏅 Top 3 en alguna temporada
                </div>
              )}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Temporada", "Pos.", "Media", "W", "L"].map((h) => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {playerSnapshots.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 12px", color: "var(--text-primary)" }}>{s.season?.name ?? "—"}</td>
                        <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>
                          {(s.rankPosition ?? 99) <= 3
                            ? ["🥇", "🥈", "🥉"][(s.rankPosition ?? 1) - 1]
                            : `#${s.rankPosition}`}
                        </td>
                        <td style={{ padding: "8px 12px", color: "var(--accent-light)" }}>{Number(s.finalMediaGlobal).toFixed(0)}</td>
                        <td style={{ padding: "8px 12px", color: "#22c55e" }}>{s.totalWins}</td>
                        <td style={{ padding: "8px 12px", color: "#ef4444" }}>{s.totalLosses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {playerSnapshots.length === 0 && (
          <div className="card" style={{ padding: "16px 14px", marginBottom: "14px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
            Aún no ha completado ninguna temporada
          </div>
        )}
      </div>
    </PageTransition>
  );
}
