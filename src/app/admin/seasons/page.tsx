import { db } from "@db/index";
import { seasons, matches, players } from "@db/schema";
import { eq, count } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import SeasonsClient from "./SeasonsClient";

export default async function AdminSeasonsPage() {
  const allSeasons = await db.query.seasons.findMany({
    orderBy: [desc(seasons.createdAt)],
  });

  const seasonStats = await Promise.all(
    allSeasons.map(async (s) => {
      const [playerCount, matchCount] = await Promise.all([
        db.select({ count: count() }).from(players).where(eq(players.seasonId, s.id)),
        db.select({ count: count() }).from(matches).where(eq(matches.seasonId, s.id)),
      ]);
      return {
        seasonId:     s.id,
        playerCount:  playerCount[0]?.count ?? 0,
        matchCount:   matchCount[0]?.count ?? 0,
      };
    })
  );

  const statsMap = Object.fromEntries(seasonStats.map((s) => [s.seasonId, s]));

  return <SeasonsClient seasons={allSeasons} statsMap={statsMap} />;
}
