import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { db } from "@db/index";
import { postmatchFlows, leagueMatches, matches } from "@db/schema";
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
  } else if (flow.matchType === "regular") {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, flow.matchId),
      with: {
        team1Player1: true,
        team1Player2: true,
        team2Player1: true,
        team2Player2: true,
      },
    });
    if (match) {
      matchData = {
        team1: { player1: match.team1Player1, player2: match.team1Player2, player1Id: match.team1Player1Id, player2Id: match.team1Player2Id },
        team2: { player1: match.team2Player1, player2: match.team2Player2, player1Id: match.team2Player1Id, player2Id: match.team2Player2Id },
      };
    }
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
