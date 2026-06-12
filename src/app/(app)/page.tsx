import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId, getCrew } from "@lib/queries/players";
import { getRecentMatches } from "@lib/queries/matches";
import { Avatar } from "@components/player/avatar";
import { XpProgressBar } from "@components/player/xp-progress-bar";
import { MatchCard } from "@components/matches/match-card";
import { PageTransition } from "@components/ui/page-transition";
import { FeedSkeleton } from "@components/ui/feed-skeleton";
import { EmptyState } from "@components/ui/empty-state";
import Link from "next/link";
import { Suspense } from "react";

async function FeedContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);

  if (!player) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
          Completa tu perfil para empezar.
        </p>
        <Link href="/profile" style={{ color: "var(--accent-light)" }}>Ir al perfil →</Link>
      </div>
    );
  }

  const [recentMatches, crew] = await Promise.all([
    getRecentMatches(player.id, 3),
    getCrew(player.id),
  ]);

  const winRate = player.totalWins + player.totalLosses > 0
    ? Math.round((player.totalWins / (player.totalWins + player.totalLosses)) * 100)
    : 0;

  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        {/* Hero card */}
        <div className="card-elevated" style={{ padding: "18px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
            <Avatar name={player.displayName} size={52} />
            <div>
              <div style={{ fontSize: "22px", fontWeight: 500 }}>{player.displayName}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                @{player.username}{player.location ? ` · ${player.location}` : ""}
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                <span className="badge-xp" style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>LV {player.level}</span>
                <span className="badge-xp" style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>{player.elo} ELO</span>
                {player.winStreak >= 3 && (
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    🔥 Racha {player.winStreak}W
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "14px" }}>
            {[
              { val: `${player.winStreak}W`, lbl: "Racha" },
              { val: player.totalWins,         lbl: "Victorias" },
              { val: `${winRate}%`,            lbl: "Win %" },
              { val: player.level,             lbl: "Nivel" },
            ].map((s) => (
              <div key={s.lbl} style={{ background: "var(--bg-primary)", borderRadius: "10px", padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 500 }}>{s.val}</div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{s.lbl}</div>
              </div>
            ))}
          </div>

          <XpProgressBar
            current={player.xp}
            total={player.xp + player.xpToNextLevel}
            level={player.level}
          />
        </div>

        {/* Partidos recientes */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 500 }}>Partidos recientes</h2>
          <Link href="/matches" style={{ fontSize: "11px", color: "var(--accent-light)" }}>Ver todos</Link>
        </div>

        {recentMatches.length === 0 ? (
          <EmptyState
            icon="🎾"
            title="Sin partidos"
            message="Aún no has jugado ningún partido."
            action={{ label: "Registra el primero →", href: "/register-match" }}
          />
        ) : (
          recentMatches.map((m) => (
            <MatchCard key={m.id} match={m} currentPlayerId={player.id} />
          ))
        )}

        {/* Crew */}
        {crew.length > 0 && (
          <>
            <h2 style={{ fontSize: "15px", fontWeight: 500, marginTop: "16px", marginBottom: "10px" }}>Amigos</h2>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
              {crew.map((p) => (
                <div key={p.id} className="card" style={{ padding: "12px 10px", textAlign: "center", minWidth: "72px" }}>
                  <Avatar name={p.displayName} size={36} />
                  <div style={{ fontSize: "11px", marginTop: "6px" }}>{p.displayName.split(" ")[0]}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>LV {p.level}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent />
    </Suspense>
  );
}
