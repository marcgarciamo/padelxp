import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";
import { searchPlayers } from "@lib/queries/social";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) return NextResponse.json([]);

  const results = await searchPlayers(q, currentPlayer.id);
  return NextResponse.json(results);
}
