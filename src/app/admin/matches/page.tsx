import { db } from "@db/index";
import { matches, postmatchFlows } from "@db/schema";
import { desc } from "drizzle-orm";
import MatchLogTable from "./MatchLogTable";

export default async function AdminMatchesPage() {
  const [allMatches, flows] = await Promise.all([
    db.query.matches.findMany({
      orderBy: [desc(matches.createdAt)],
      limit: 200,
      with: {
        team1Player1: { columns: { displayName: true, avatarUrl: true } },
        team1Player2: { columns: { displayName: true, avatarUrl: true } },
        team2Player1: { columns: { displayName: true, avatarUrl: true } },
        team2Player2: { columns: { displayName: true, avatarUrl: true } },
      },
    }),
    db.query.postmatchFlows.findMany({
      where: (f, { eq }) => eq(f.matchType, "regular"),
      columns: { id: true, matchId: true, status: true },
    }),
  ]);

  const flowMap = Object.fromEntries(flows.map((f) => [f.matchId, f]));

  return <MatchLogTable matches={allMatches} flowMap={flowMap} />;
}
