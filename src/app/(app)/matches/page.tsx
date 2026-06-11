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

interface Props {
  searchParams: Promise<{ limit?: string }>;
}

export default async function MatchesPage({ searchParams }: Props) {
  const { limit: limitParam } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const currentLimit = limitParam ? parseInt(limitParam, 10) : 10;
  const player = await getPlayerByUserId(session.user.id);
  const matches = player ? await getRecentMatches(player.id, currentLimit) : [];
  
  const hasMore = matches.length === currentLimit;

  return (
    <PageTransition>
      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500 }}>Partidos</h1>
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

        {hasMore && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Link 
              href={`/matches?limit=${currentLimit + 10}`}
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
