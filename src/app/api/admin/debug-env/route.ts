import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSession, ADMIN_COOKIE_NAME, getAdminSecret } from "@lib/admin-session";
import { jwtVerify } from "jose";
import { db } from "@db/index";
import { players, matches, postmatchFlows, seasons } from "@db/schema";
import { eq, gte, count, desc } from "drizzle-orm";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;

  let verifyResult: unknown = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getAdminSecret());
      verifyResult = { ok: true, payload };
    } catch (e) {
      verifyResult = { ok: false, error: String(e) };
    }
  }

  const session = await getAdminSession();

  // Test dashboard queries
  const queryResults: Record<string, unknown> = {};
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);

  try {
    await db.select({ count: count() }).from(players);
    queryResults.players = "ok";
  } catch (e) { queryResults.players = String(e); }

  try {
    await db.select({ count: count() }).from(players).where(gte(players.createdAt, sevenDaysAgo));
    queryResults.newPlayers = "ok";
  } catch (e) { queryResults.newPlayers = String(e); }

  try {
    await db.select({ count: count() }).from(matches).where(gte(matches.playedAt, sevenDaysAgo));
    queryResults.matches = "ok";
  } catch (e) { queryResults.matches = String(e); }

  try {
    await db.query.seasons.findFirst({ where: eq(seasons.status, "active") });
    queryResults.seasons = "ok";
  } catch (e) { queryResults.seasons = String(e); }

  try {
    await db.select({ count: count() }).from(postmatchFlows).where(eq(postmatchFlows.status, "pending_validation"));
    queryResults.postmatchFlows = "ok";
  } catch (e) { queryResults.postmatchFlows = String(e); }

  try {
    await db.query.matches.findMany({
      orderBy: [desc(matches.playedAt)],
      limit: 10,
      with: {
        team1Player1: { columns: { displayName: true } },
        team2Player1: { columns: { displayName: true } },
      },
    });
    queryResults.recentMatches = "ok";
  } catch (e) { queryResults.recentMatches = String(e); }

  return NextResponse.json({
    cookiePresent: !!token,
    verifyResult,
    session: session ? { username: session.username } : null,
    queryResults,
  });
}
