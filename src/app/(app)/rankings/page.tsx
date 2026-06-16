import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getLeaderboard } from "@lib/queries/players";
import { getPlayerByUserId } from "@lib/queries/players";
import { getFriendsLeaderboard } from "@lib/queries/social";
import { Avatar } from "@components/player/avatar";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RankingsSkeleton } from "@components/ui/rankings-skeleton";
import { PageTransition } from "@components/ui/page-transition";
import { AnimatedList } from "@components/ui/animated-list";
import { EmptyState } from "@components/ui/empty-state";
import Link from "next/link";
import { MvpBadge } from "@components/mvp/mvp-badge";
import { calculateGlobalRating } from "@lib/attributes";

interface Props {
  searchParams: Promise<{ tab?: string; limit?: string }>;
}

async function RankingsContent({ tab, limitParam }: { tab?: string | undefined; limitParam?: string | undefined }) {
  const isFriends = tab === "friends";
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const currentLimit = limitParam ? parseInt(limitParam, 10) : 50;

  const currentPlayer = await getPlayerByUserId(session.user.id);
  const leaderboard = isFriends && currentPlayer
    ? await getFriendsLeaderboard(currentPlayer.id)
    : await getLeaderboard(currentLimit);

  const hasMore = !isFriends && leaderboard.length === currentLimit;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "16px" }}>Clasificación</h1>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", background: "var(--bg-elevated)", padding: "4px", borderRadius: "12px" }}>
          <Link 
            href="/rankings"
            style={{ 
              flex: 1, 
              textAlign: "center", 
              padding: "8px", 
              borderRadius: "8px", 
              fontSize: "13px", 
              fontWeight: 500,
              textDecoration: "none",
              background: !isFriends ? "var(--bg-primary)" : "transparent",
              color: !isFriends ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: !isFriends ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
            }}
          >
            Global
          </Link>
          <Link 
            href="/rankings?tab=friends"
            style={{ 
              flex: 1, 
              textAlign: "center", 
              padding: "8px", 
              borderRadius: "8px", 
              fontSize: "13px", 
              fontWeight: 500,
              textDecoration: "none",
              background: isFriends ? "var(--bg-primary)" : "transparent",
              color: isFriends ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: isFriends ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
            }}
          >
            Amigos
          </Link>
        </div>

        {leaderboard.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="Sin jugadores"
            message={isFriends ? "Aún no tienes amigos." : "Aún no hay jugadores en el ranking."}
          />
        ) : (
          <AnimatedList>
            {leaderboard.map((player, i) => {
              const isCurrentPlayer = player.id === currentPlayer?.id;
              return (
                <div
                  key={player.id}
                  className="card"
                  style={{
                    padding:      "12px 14px",
                    marginBottom: "8px",
                    display:      "flex",
                    alignItems:   "center",
                    gap:          "12px",
                    borderLeft:   isCurrentPlayer ? "3px solid var(--accent)" : undefined,
                    background:   isCurrentPlayer ? "var(--bg-elevated)" : undefined,
                  }}
                >
                  <div style={{ fontSize: i < 3 ? "20px" : "16px", width: "28px", textAlign: "center", color: "var(--text-muted)", fontWeight: 500 }}>
                    {i < 3 ? medals[i] : i + 1}
                  </div>
                  <Avatar name={player.displayName} src={player.avatarUrl} size={36} playerId={player.id} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                      {player.displayName}
                      {(player as any).mvpCount > 0 && <MvpBadge count={(player as any).mvpCount} size="sm" />}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Nivel {player.level} · {player.totalWins}V {player.totalLosses}D</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 500 }}>{calculateGlobalRating(player)}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Media</div>
                  </div>
                </div>
              );
            })}
          </AnimatedList>
        )}

        {hasMore && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Link 
              href={`/rankings?limit=${currentLimit + 50}`}
              style={{
                display: "inline-block",
                padding: "10px 20px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none"
              }}
            >
              Cargar más...
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default async function RankingsPage({ searchParams }: Props) {
  const { tab, limit } = await searchParams;
  return (
    <Suspense fallback={<RankingsSkeleton />}>
      <RankingsContent tab={tab} limitParam={limit} />
    </Suspense>
  );
}
