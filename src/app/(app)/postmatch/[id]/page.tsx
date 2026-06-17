import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { db } from "@db/index";
import { postmatchFlows, leagueMatches } from "@db/schema";
import { eq } from "drizzle-orm";
import { PostmatchFlow } from "@components/postmatch/postmatch-flow";

export default async function PostmatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }  = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/onboarding");

  const flow = await db.query.postmatchFlows.findFirst({
    where: eq(postmatchFlows.id, id),
    with: {
      validations: true,
      completions: true,
      prestiges:   true,
    },
  });

  if (!flow) notFound();

  const myCompletion = flow.completions.find((c) => c.playerId === player.id);
  if (!myCompletion) redirect("/");

  let matchData: any = null;
  if (flow.matchType === "league") {
    matchData = await db.query.leagueMatches.findFirst({
      where: eq(leagueMatches.id, flow.matchId),
      with: {
        team1:  { with: { player1: true, player2: true } },
        team2:  { with: { player1: true, player2: true } },
        league: true,
      },
    });
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)", padding: "1.25rem" }}>
      <PostmatchFlow
        flow={flow}
        currentPlayer={player}
        myCompletion={myCompletion}
        matchData={matchData}
      />
    </div>
  );
}
