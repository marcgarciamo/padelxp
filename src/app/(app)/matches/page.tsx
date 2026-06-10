import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getRecentMatches } from "@lib/queries/matches";
import { MatchCard } from "@components/matches/match-card";
import { PageTransition } from "@components/ui/page-transition";
import { AnimatedList } from "@components/ui/animated-list";
import { EmptyState } from "@components/ui/empty-state";
import Link from "next/link";

export default async function MatchesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  const matches = player ? await getRecentMatches(player.id, 20) : [];

  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500 }}>Partidos</h1>
          <Link
            href="/register-match"
            style={{
              background:   "var(--accent)",
              color:        "#000",
              padding:      "7px 14px",
              borderRadius: "20px",
              fontSize:     "12px",
              fontWeight:   600,
              textDecoration: "none",
            }}
          >
            + Nuevo
          </Link>
        </div>

        {matches.length === 0 ? (
          <EmptyState
            icon="🎾"
            title="Sin partidos"
            message="No tienes partidos registrados."
            action={{ label: "Registra tu primer partido →", href: "/register-match" }}
          />
        ) : (
          <AnimatedList>
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} currentPlayerId={player?.id} />
            ))}
          </AnimatedList>
        )}
      </div>
    </PageTransition>
  );
}
