import { NextRequest, NextResponse } from "next/server";
import { db } from "@db/index";
import { matches, players, postmatchFlows, postmatchCompletions } from "@db/schema";
import { env } from "@lib/env";
import postgres from "postgres";
import { hashPassword } from "better-auth/crypto";

function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function POST(_req: NextRequest) {
  if (env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  const client = postgres(env.DATABASE_URL, { ssl: "require" });

  try {
    const suffix = Date.now();
    const password = "Test123456";
    const hash = await hashPassword(password);

    const userIds: string[] = [];
    const emails: string[] = [];

    console.log("[setup-postmatch] step 1: creating users");
    for (let i = 0; i < 4; i++) {
      const email = `pmvp${i + 1}_${suffix}@local`;
      const userId = makeId();

      await client`
        INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
        VALUES (${userId}, ${"MVPTest P" + (i + 1)}, ${email}, true, now(), now())
      `;

      await client`
        INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
        VALUES (${makeId()}, ${email}, 'credential', ${userId}, ${hash}, now(), now())
      `;

      userIds.push(userId);
      emails.push(email);
    }

    console.log("[setup-postmatch] step 2: creating players");
    const playerRecords = [];
    for (let i = 0; i < 4; i++) {
      const [p] = await db.insert(players).values({
        userId:      userIds[i]!,
        username:    `pmvptest${suffix}p${i + 1}`,
        displayName: `MVPTest P${i + 1}`,
      }).returning();
      playerRecords.push(p!);
    }

    const [p1, p2, p3, p4] = playerRecords as NonNullable<typeof playerRecords[number]>[];

    console.log("[setup-postmatch] step 3: creating match");
    const [match] = await db.insert(matches).values({
      venue:          "Test Court",
      playedAt:       new Date(),
      team1Player1Id: p1.id,
      team1Player2Id: p2.id,
      team2Player1Id: p3.id,
      team2Player2Id: p4.id,
      winnerTeam:     "team1",
      sets:           [{ team1: 6, team2: 4 }],
      createdBy:      p1.id,
    }).returning();

    console.log("[setup-postmatch] step 4: creating flow, matchId=", match!.id);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [flow] = await db.insert(postmatchFlows).values({
      matchId:          match!.id,
      matchType:        "regular",
      status:           "pending_voting",
      createdBy:        p1.id,
      proposedSets:     [{ team1: 6, team2: 4 }],
      proposedWinner:   "team1",
      validationsCount: 4,
      expiresAt,
    }).returning();

    console.log("[setup-postmatch] step 5: creating completions, flowId=", flow!.id);
    for (const p of [p1, p2, p3, p4]) {
      await db.insert(postmatchCompletions).values({
        flowId:    flow!.id,
        playerId:  p.id,
        validated: true,
        mvpVoted:  false,
      });
    }

    await client.end();
    console.log("[setup-postmatch] done");

    return NextResponse.json({
      flowId: flow!.id,
      users: emails.map((email, i) => ({
        email,
        password,
        playerId:    playerRecords[i]!.id,
        displayName: playerRecords[i]!.displayName,
      })),
    });
  } catch (err: any) {
    await client.end().catch(() => {});
    const msg = err?.message || "";
    const subErrors = Array.isArray(err?.errors)
      ? err.errors.map((e: any) => e?.message || JSON.stringify(e)).join("; ")
      : "";
    const detail = msg || subErrors || JSON.stringify(err);
    console.error("[setup-postmatch] ERROR:", detail, err);
    return NextResponse.json({ error: detail || "unknown" }, { status: 500 });
  }
}
