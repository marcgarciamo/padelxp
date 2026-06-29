import { db } from "@db/index";
import { players, matches, postmatchFlows, seasons } from "@db/schema";
import { eq, gte, lt, count, sql, desc } from "drizzle-orm";
import { subDays, format, differenceInDays } from "date-fns";
import { Users, Swords, CalendarRange, Clock } from "lucide-react";
import StatCard from "@components/admin/StatCard";
import ActivityChart from "@components/admin/ActivityChart";
import LevelDistributionChart from "@components/admin/LevelDistributionChart";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default async function AdminDashboard() {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const [
    totalPlayers,
    newPlayers7d,
    matchesThisWeek,
    activeSeason,
    pendingFlows,
    top10,
    allPlayers,
    recentMatches,
  ] = await Promise.all([
    db.select({ count: count() }).from(players),
    db.select({ count: count() }).from(players).where(gte(players.createdAt, sevenDaysAgo)),
    db.select({ count: count() }).from(matches).where(gte(matches.playedAt, sevenDaysAgo)),
    db.query.seasons.findFirst({ where: eq(seasons.status, "active") }),
    db.select({ count: count() }).from(postmatchFlows)
      .where(eq(postmatchFlows.status, "pending_validation")),
    db.query.players.findMany({
      orderBy: [desc(players.elo)],
      limit: 10,
      columns: { id: true, displayName: true, avatarUrl: true, elo: true, totalWins: true,
                 attrAttack: true, attrDefense: true, attrVolley: true, attrConsistency: true,
                 attrBandeja: true, attrRemate: true },
    }),
    db.query.players.findMany({ columns: { level: true } }),
    db.query.matches.findMany({
      orderBy: [desc(matches.playedAt)],
      limit: 20,
      with: {
        team1Player1: { columns: { displayName: true } },
        team2Player1: { columns: { displayName: true } },
      },
    }),
  ]);

  // Activity by day last 30 days
  const matchRows = await db.query.matches.findMany({
    where: gte(matches.playedAt, thirtyDaysAgo),
    columns: { playedAt: true },
  });

  const dayMap: Record<string, { regular: number; league: number; tournament: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = format(subDays(now, 29 - i), "yyyy-MM-dd");
    dayMap[d] = { regular: 0, league: 0, tournament: 0 };
  }
  for (const m of matchRows) {
    const d = format(new Date(m.playedAt), "yyyy-MM-dd");
    if (dayMap[d]) dayMap[d]!.regular++;
  }
  const chartData = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

  // Level distribution
  const levelBuckets = [
    { range: "1–10", min: 1, max: 10 },
    { range: "11–20", min: 11, max: 20 },
    { range: "21–30", min: 21, max: 30 },
    { range: "31–40", min: 31, max: 40 },
    { range: "41–50", min: 41, max: 50 },
  ];
  const levelData = levelBuckets.map((b) => ({
    range: b.range,
    count: allPlayers.filter((p) => p.level >= b.min && p.level <= b.max).length,
  }));

  const seasonDaysLeft = activeSeason?.endDate
    ? differenceInDays(new Date(activeSeason.endDate), now)
    : null;

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Vista general de la plataforma</p>
      </div>

      {/* KPIs */}
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
          {...(seasonDaysLeft !== null ? { delta: `${seasonDaysLeft} días restantes` } : {})}
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
        <ActivityChart data={chartData} />
      </div>

      {/* Top 10 + level distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Top 10 jugadores</h2>
          <div className="space-y-2">
            {top10.map((p, i) => {
              const media = Math.round((p.attrAttack + p.attrDefense + p.attrVolley + p.attrConsistency + p.attrBandeja + p.attrRemate) / 6);
              return (
                <div key={p.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs text-zinc-600 w-5 text-right">{i + 1}</span>
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" className="size-7 rounded-full object-cover" />
                  ) : (
                    <div className="size-7 rounded-full bg-violet-800 flex items-center justify-center text-xs font-bold text-white">
                      {p.displayName[0]}
                    </div>
                  )}
                  <span className="flex-1 text-sm text-zinc-200 truncate">{p.displayName}</span>
                  <span className="text-xs text-violet-400 font-mono">{media}</span>
                  <span className="text-xs text-zinc-500">{p.totalWins}W</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Distribución de niveles</h2>
          <LevelDistributionChart data={levelData} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Partidos recientes</h2>
        <div className="space-y-2">
          {recentMatches.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0 text-sm">
              <span className="text-zinc-400">
                {m.team1Player1?.displayName} vs {m.team2Player1?.displayName}
              </span>
              <span className="text-xs text-zinc-600">
                {formatDistanceToNow(new Date(m.playedAt), { addSuffix: true, locale: es })}
              </span>
            </div>
          ))}
          {!recentMatches.length && (
            <p className="text-zinc-600 text-sm text-center py-4">Sin partidos aún</p>
          )}
        </div>
      </div>
    </div>
  );
}
