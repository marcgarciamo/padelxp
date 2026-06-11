import { NextResponse } from "next/server";
import { db } from "@db/index";
import { players } from "@db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { userId, name } = await request.json();

    if (!userId || !name) {
      return NextResponse.json({ success: false, error: "Missing data" }, { status: 400 });
    }

    const existing = await db.query.players.findFirst({
      where: eq(players.userId, userId),
    });

    if (existing) {
      return NextResponse.json({ success: true });
    }

    const username = name.toLowerCase().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 1000);

    await db.insert(players).values({
      userId,
      username,
      displayName: name,
      elo: 1500,
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API error creating player profile:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
