import { NextResponse } from "next/server";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { db } from "@db/index";
import { players } from "@db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { userId, name } = await request.json();

    if (!userId || !name) {
      return NextResponse.json({ success: false, error: "Missing data" }, { status: 400 });
    }

    // Solo puede crear su propio perfil
    if (userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.query.players.findFirst({ where: eq(players.userId, userId) });
    if (existing) return NextResponse.json({ success: true });

    const username = name.toLowerCase().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 1000);
    await db.insert(players).values({ userId, username, displayName: name, elo: 1500, level: 1, xp: 0, xpToNextLevel: 1000 });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
