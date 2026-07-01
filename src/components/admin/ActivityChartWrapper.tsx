import { db } from "@db/index";
import { matches, leagueMatches, tournamentMatches } from "@db/schema";
import { gte } from "drizzle-orm";
import { subDays, format, eachDayOfInterval } from "date-fns";
import ActivityChart from "@components/admin/ActivityChart";

export default async function ActivityChartWrapper() {
  const thirtyDaysAgo = subDays(new Date(), 30);

  const [regular, league, tournament] = await Promise.all([
    db.select({ createdAt: matches.createdAt }).from(matches).where(gte(matches.createdAt, thirtyDaysAgo)),
    db.select({ createdAt: leagueMatches.createdAt }).from(leagueMatches).where(gte(leagueMatches.createdAt, thirtyDaysAgo)),
    db.select({ createdAt: tournamentMatches.createdAt }).from(tournamentMatches).where(gte(tournamentMatches.createdAt, thirtyDaysAgo)),
  ]);

  const toMap = (rows: { createdAt: Date }[]) => {
    const m: Record<string, number> = {};
    for (const r of rows) {
      const key = format(new Date(r.createdAt), "yyyy-MM-dd");
      m[key] = (m[key] ?? 0) + 1;
    }
    return m;
  };

  const regMap = toMap(regular);
  const leaMap = toMap(league);
  const touMap = toMap(tournament);

  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });
  const data = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return {
      date: key,
      regular:    regMap[key] ?? 0,
      league:     leaMap[key] ?? 0,
      tournament: touMap[key] ?? 0,
    };
  });

  return <ActivityChart data={data} />;
}
