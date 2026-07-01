import { db } from "@db/index";
import { players, matches, postmatchFlows, seasons } from "@db/schema";
import { eq, gte, count, desc } from "drizzle-orm";
import { subDays, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Swords, CalendarRange, Clock } from "lucide-react";
import { Suspense } from "react";
import StatCard from "@components/admin/StatCard";
import RecalculateButton from "@components/admin/RecalculateButton";
import ActivityChartWrapper from "@components/admin/ActivityChartWrapper";
import LevelDistributionChartWrapper from "@components/admin/LevelDistributionChartWrapper";

export const dynamic = "force-dynamic";

function ChartSkeleton({ height = "h-56" }: { height?: string }) {
  return <div className={`${height} rounded-xl bg-zinc-800/60 animate-pulse`} />;
}

export default async function AdminDashboard() {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);

  const [totalPlayers, newPlayers7d, matchesThisWeek, activeSeason, pendingFlows, recentMatches, top10] =
    await Promise.all([
      db.select({ count: count() }).from(players),
      db.select({ count: count() }).from(players).where(gte(players.createdAt, sevenDaysAgo)),
      db.select({ count: count() }).from(matches).where(gte(matches.playedAt, sevenDaysAgo)),
      db.query.seasons.findFirst({ where: eq(seasons.status, "active") }),
      db.select({ count: count() }).from(postmatchFlows).where(eq(postmatchFlows.status, "pending_validation")),
      db.query.matches.findMany({
        orderBy: [desc(matches.playedAt)],
        limit: 10,
        with: {
          team1Player1: { columns: { displayName: true } },
          team2Player1: { columns: { displayName: true } },
        },
      }),
      db.query.players.findMany({
        orderBy: [desc(players.elo)],
        limit: 10,
        columns: { id: true, displayName: true, elo: true, level: true,
          attrAttack: true, attrDefense: true, attrVolley: true,
          attrConsistency: true, attrBandeja: true, attrRemate: true },
      }),
    ]);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Vista general de la plataforma</p>
        </div>
        <RecalculateButton />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total jugadores"
          value={totalPlayers[0]?.count ?? 0}
          delta={`+${newPlayers7d[0]?.count ?? 0} esta semana`}
          icon={Users}
        />
        <StatCard
          title="Partidos esta semana"
          value={matchesThisWeek[0]?.count ?? 0}
          icon={Swords}
        />
        <StatCard
          title="Temporada activa"
          value={activeSeason ? activeSeason.name : "Sin temporada"}
          icon={CalendarRange}
        />
        <StatCard
          title="Flujos pendientes"
          value={pendingFlows[0]?.count ?? 0}
          icon={Clock}
          alert={(pendingFlows[0]?.count ?? 0) > 0}
        />
      </div>

      {/* Activity chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Actividad últimos 30 días</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <ActivityChartWrapper />
        </Suspense>
      </div>

      {/* Top 10 + Level distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Top 10 jugadores</h2>
          {top10.length === 0 ? (
            <p className="text-zinc-500 text-sm">Sin jugadores</p>
          ) : (
            <div className="space-y-2">
              {top10.map((p, i) => {
                const media = Math.round(
                  (p.attrAttack + p.attrDefense + p.attrVolley + p.attrConsistency + p.attrBandeja + p.attrRemate) / 6
                );
                return (
                  <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-zinc-800 last:border-0 text-sm">
                    <span className="text-zinc-600 font-mono w-5 text-right">{i + 1}</span>
                    <span className="flex-1 text-zinc-300 truncate">{p.displayName}</span>
                    <span className="text-violet-400 font-mono text-xs">Nv.{p.level}</span>
                    <span className="text-zinc-400 font-mono text-xs w-8 text-right">{media}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Distribución de niveles</h2>
          <Suspense fallback={<ChartSkeleton height="h-48" />}>
            <LevelDistributionChartWrapper />
          </Suspense>
        </div>
      </div>

      {/* Recent matches */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Partidos recientes</h2>
        {recentMatches.length === 0 ? (
          <p className="text-zinc-500 text-sm">Sin partidos registrados</p>
        ) : (
          <div className="space-y-2">
            {recentMatches.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0 text-sm"
              >
                <span className="text-zinc-400">
                  {m.team1Player1?.displayName} vs {m.team2Player1?.displayName}
                </span>
                <span className="text-xs text-zinc-600">
                  {formatDistanceToNow(new Date(m.playedAt), { addSuffix: true, locale: es })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
