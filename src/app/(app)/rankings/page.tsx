import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getLeaderboard } from "@lib/queries/players";
import { getPlayerByUserId } from "@lib/queries/players";
import { Avatar } from "@components/player/avatar";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RankingsSkeleton } from "@components/ui/rankings-skeleton";
import { PageTransition } from "@components/ui/page-transition";
import { AnimatedList } from "@components/ui/animated-list";
import { EmptyState } from "@components/ui/empty-state";

async function RankingsContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [leaderboard, currentPlayer] = await Promise.all([
    getLeaderboard(50),
    getPlayerByUserId(session.user.id),
  ]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "16px" }}>Rankings</h1>

        {leaderboard.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="Sin jugadores"
            message="Aún no hay jugadores en el ranking."
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

export default function RankingsPage() {
  return (
    <Suspense fallback={<RankingsSkeleton />}>
      <RankingsContent />
    </Suspense>
  );
}
