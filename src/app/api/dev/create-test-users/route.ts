import { NextRequest, NextResponse } from "next/server";
import { db } from "@db/index";
import { leagues, leagueTeams, players } from "@db/schema";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { env } from "@lib/env";
import { hashPassword } from "better-auth/crypto";

export async function POST(request: NextRequest) {
  if (env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  const { leagueId, count = 4 } = await request.json();

  if (!leagueId) {
    return NextResponse.json({ error: "leagueId required" }, { status: 400 });
  }

  const league = await db.query.leagues.findFirst({
    where: eq(leagues.id, leagueId),
  });

  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }

  const client = postgres(env.DATABASE_URL, { ssl: "require" });
  const createdUsers = [];

  try {
    for (let i = 0; i < count; i += 2) {
      const p1Email = `test_${Date.now()}_${i}@local`;
      const p2Email = `test_${Date.now()}_${i + 1}@local`;
      const password = await hashPassword("Test123456");

      const p1Result = await client`
        INSERT INTO "user" (email, password_hash, name, email_verified)
        VALUES (${p1Email}, ${password}, ${'TestPlayer ' + (i + 1)}, true)
        RETURNING id, email, name
      `;

      const p2Result = await client`
        INSERT INTO "user" (email, password_hash, name, email_verified)
        VALUES (${p2Email}, ${password}, ${'TestPlayer ' + (i + 2)}, true)
        RETURNING id, email, name
      `;

      if (!p1Result[0] || !p2Result[0]) continue;

      const p1UserId = (p1Result[0] as any).id;
      const p2UserId = (p2Result[0] as any).id;

      const p1Player = await db
        .insert(players)
        .values({
          userId: p1UserId,
          username: `testplayer${i + 1}`,
          displayName: `TestPlayer ${i + 1}`,
        })
        .returning();

      const p2Player = await db
        .insert(players)
        .values({
          userId: p2UserId,
          username: `testplayer${i + 2}`,
          displayName: `TestPlayer ${i + 2}`,
        })
        .returning();

      if (p1Player[0] && p2Player[0]) {
        await db.insert(leagueTeams).values({
          leagueId,
          player1Id: p1Player[0].id,
          player2Id: p2Player[0].id,
        });

        createdUsers.push({
          player1: p1Player[0].displayName,
          player2: p2Player[0].displayName,
        });
      }
    }

    await client.end();

    return NextResponse.json({
      ok: true,
      created: createdUsers.length,
      teams: createdUsers,
    });
  } catch (error) {
    console.error("Error creating test users:", error);
    await client.end();
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
