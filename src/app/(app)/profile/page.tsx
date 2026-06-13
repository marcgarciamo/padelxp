import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getEloHistory, getAdvancedStats } from "@lib/queries/stats";
import { AvatarUpload } from "@components/player/avatar-upload";
import { XpProgressBar } from "@components/player/xp-progress-bar";
import { PageTransition } from "@components/ui/page-transition";
import { EloChart } from "@components/player/elo-chart";
import { AdvancedStats } from "@components/player/advanced-stats";
import { EditProfileForm } from "@components/player/edit-profile-form";
import PlayerCardPreviewLink from "@components/player/player-card-preview-link";
import { CollapsibleSection } from "@components/ui/collapsible-section";
import { Suspense } from "react";

const ACHIEVEMENT_META: Record<string, { icon: string; label: string }> = {
  first_win: { icon: "⭐", label: "Primera victoria" },
  win_streak_3: { icon: "🔥", label: "Racha 3W" },
  win_streak_5: { icon: "🔥", label: "Racha 5W" },
  win_streak_10: { icon: "🔥", label: "Racha 10W" },
  top_3_ranking: { icon: "🏅", label: "Top 3" },
  level_10: { icon: "⚡", label: "Nivel 10" },
  level_25: { icon: "💎", label: "Nivel 25" },
  comeback_win: { icon: "↩️", label: "Comeback" },
  volley_master: { icon: "🎾", label: "Volea Master" },
  consistent_player: { icon: "🎯", label: "Consistente" },
  century_matches: { icon: "🏆", label: "100 partidos" },
};

async function ProfileContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/");

  const [eloHistoryData, advancedStats] = await Promise.all([
    getEloHistory(player.id, 20),
    getAdvancedStats(player.id),
  ]);

  const earnedTypes = new Set(player.achievements.map((a) => a.type));
  const winRate =
    player.totalWins + player.totalLosses > 0
      ? Math.round(
          (player.totalWins /
            (player.totalWins + player.totalLosses)) *
            100
        )
      : 0;

  const attrs = [
    {
      name: "Ataque",
      val: player.attrAttack,
      color: "#ef4444",
    },
    {
      name: "Defensa",
      val: player.attrDefense,
      color: "#0ea5e9",
    },
    {
      name: "Volea",
      val: player.attrVolley,
      color: "#8b5cf6",
    },
    {
      name: "Consistencia",
      val: player.attrConsistency,
      color: "#22c55e",
    },
  ];

  return (
    <div style={{ padding: "1.25rem" }}>
      {/* Avatar upload + hero */}
      <div
        className="card-elevated"
        style={{
          padding: "18px",
          marginBottom: "14px",
        }}
      >
        <AvatarUpload
          currentUrl={player.avatarUrl}
          displayName={player.displayName}
        />
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <div style={{ fontSize: "20px", fontWeight: 500 }}>
            {player.displayName}
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            @{player.username}
          </div>
          {player.location && (
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              📍 {player.location}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "8px" }}>
            <span
              className="badge-xp"
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              LV {player.level}
            </span>
            <span
              className="badge-xp"
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              {player.elo} ELO
            </span>
          </div>
          <div style={{ marginTop: "12px" }}>
            <XpProgressBar
              current={player.xp}
              total={player.xp + player.xpToNextLevel}
              level={player.level}
            />
          </div>
        </div>
      </div>

      {/* Gráfica ELO */}
      <h2 style={{ fontSize: "15px", fontWeight: 500, marginBottom: "10px" }}>
        Evolución ELO
      </h2>
      <div className="card" style={{ padding: "14px", marginBottom: "14px" }}>
        <EloChart history={eloHistoryData} />
      </div>

      {/* Stats avanzadas */}
      <h2 style={{ fontSize: "15px", fontWeight: 500, marginBottom: "10px" }}>
        Estadísticas avanzadas
      </h2>
      <div style={{ marginBottom: "14px" }}>
        <AdvancedStats stats={advancedStats} />
      </div>

      {/* Atributos */}
      <CollapsibleSection title="Atributos" defaultOpen={false}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          {attrs.map((a) => (
            <div
              key={a.name}
              className="card"
              style={{ padding: "12px 14px" }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                {a.name}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 500,
                  marginBottom: "6px",
                }}
              >
                {a.val}
              </div>
              <div
                style={{
                  height: "4px",
                  background: "var(--bg-elevated)",
                  borderRadius: "2px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${a.val}%`,
                    background: a.color,
                    borderRadius: "2px",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Logros */}
      <CollapsibleSection title="Logros" defaultOpen={false}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "6px",
          }}
        >
          {Object.entries(ACHIEVEMENT_META).map(([type, meta]) => {
            const earned = earnedTypes.has(
              type as typeof player.achievements[0]["type"]
            );
            return (
              <div
                key={type}
                style={{
                  padding: "10px 6px",
                  textAlign: "center",
                  borderRadius: "10px",
                  fontSize: "10px",
                  border: earned
                    ? "1px solid rgba(124,92,252,0.4)"
                    : "1px solid var(--border)",
                  background: earned
                    ? "rgba(124,92,252,0.08)"
                    : "var(--bg-surface)",
                  color: earned ? "var(--accent-light)" : "var(--text-hint)",
                }}
              >
                <div style={{ fontSize: "18px", marginBottom: "4px" }}>
                  {meta.icon}
                </div>
                {meta.label}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Edición de perfil */}
      <CollapsibleSection title="Editar perfil" defaultOpen={false}>
        <EditProfileForm player={player} />
      </CollapsibleSection>

      {/* Player card */}
      <PlayerCardPreviewLink player={player} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="card"
              style={{
                height: "100px",
                opacity: 0.5,
                animation: "skeleton-pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      }
    >
      <PageTransition>
        <ProfileContent />
      </PageTransition>
    </Suspense>
  );
}
