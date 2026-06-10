"use server";

import { db } from "@db/index";
import { players } from "@db/schema";
import { eq } from "drizzle-orm";

export async function createPlayerProfile(userId: string, name: string) {
  try {
    const existing = await db.query.players.findFirst({
      where: eq(players.userId, userId),
    });

    if (existing) return { success: true, player: existing };

    const username = name.toLowerCase().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 1000);

    const [newPlayer] = await db.insert(players).values({
      userId,
      username,
      displayName: name,
      elo: 1500,
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
    }).returning();

    return { success: true, player: newPlayer };
  } catch (error: any) {
    console.error("Database error in createPlayerProfile:", error);
    return { success: false, error: error.message || "Unknown database error" };
  }
}
