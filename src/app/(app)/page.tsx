import { auth } from "@lib/auth";
import { db } from "@db/index";
import { seasons } from "@db/schema";
import { eq, desc } from "drizzle-orm";
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

  const [recentMatches, crew, activeSeason] = await Promise.all([
    getRecentMatches(player.id, 3),
    getCrew(player.id),
    db.query.seasons.findFirst({ where: eq(seasons.isActive, true) }),
  ]);

  const winRate = player.totalWins + player.totalLosses > 0
    ? Math.round((player.totalWins / (player.totalWins + player.totalLosses)) * 100)
    : 0;

  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        {/* Hero banner */}
        <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", marginBottom: "16px", height: "180px" }}>
          {/* Fondo: avatar difuminado o gradiente */}
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt=""
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "top center",
                filter: "blur(18px) brightness(0.45) saturate(1.4)",
                transform: "scale(1.1)",
              }}
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, #0d2137 0%, #0a1628 60%, #071020 100%)",
            }} />
          )}

          {/* Gradiente oscuro inferior */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)",
          }} />

          {/* Season badge arriba a la izquierda */}
          {activeSeason && (
            <div style={{
              position: "absolute", top: "12px", left: "14px",
              fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.7)", fontWeight: 600,
            }}>
              🏆 {activeSeason.name}
            </div>
          )}

          {/* Contenido centrado */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-end",
            padding: "0 16px 16px",
            gap: "6px",
          }}>
            <Avatar name={player.displayName} src={player.avatarUrl} size={56} playerId={player.id} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                {player.displayName}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>
                @{player.username}{player.location ? ` · ${player.location}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
              <span className="badge-xp" style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>LV {player.level}</span>
              <span className="badge-xp" style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>{player.elo} ELO</span>
              {player.winStreak >= 3 && (
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
                  🔥 {player.winStreak}W
                </span>
              )}
            </div>
          </div>
        </div>

        {/* XP bar debajo del banner */}
        <div style={{ marginBottom: "20px" }}>
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
                  <Avatar name={p.displayName} src={p.avatarUrl} size={36} playerId={p.id} />
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
