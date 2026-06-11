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

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

async function RankingsContent({ tab }: { tab?: string | undefined }) {
  const isFriends = tab === "friends";
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  const leaderboard = isFriends && currentPlayer
    ? await getFriendsLeaderboard(currentPlayer.id)
    : await getLeaderboard(50);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "16px" }}>Rankings</h1>

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
            message={isFriends ? "Aún no tienes amigos en tu crew." : "Aún no hay jugadores en el ranking."}
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
                  <Avatar name={player.displayName} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{player.displayName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Nivel {player.level} · {player.totalWins}V {player.totalLosses}D</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 500 }}>{player.elo}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>ELO</div>
                  </div>
                </div>
              );
            })}
          </AnimatedList>
        )}
      </div>
    </PageTransition>
  );
}

export default async function RankingsPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  return (
    <Suspense fallback={<RankingsSkeleton />}>
      <RankingsContent tab={tab} />
    </Suspense>
  );
}
