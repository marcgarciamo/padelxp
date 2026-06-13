"use server";

import { db } from "@db/index";
import { players } from "@db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { sendFriendRequest } from "@lib/actions/social";

const OnboardingSchema = z.object({
  username:        z.string()
                    .min(3, "Mínimo 3 caracteres")
                    .max(20, "Máximo 20 caracteres")
                    .regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y _"),
  displayName:     z.string().min(2, "Mínimo 2 caracteres").max(50),
  location:        z.string().max(50).optional(),
  position:        z.enum(["left", "right", "both"]),
  attrAttack:      z.coerce.number().min(1).max(100),
  attrDefense:     z.coerce.number().min(1).max(100),
  attrVolley:      z.coerce.number().min(1).max(100),
  attrConsistency: z.coerce.number().min(1).max(100),
  firstFriendId:   z.string().uuid().optional(),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (username.length < 3) return false;
  const existing = await db.query.players.findFirst({
    where: eq(players.username, username.toLowerCase()),
    columns: { id: true },
  });
  return !existing;
}

export async function completeOnboarding(input: OnboardingInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = OnboardingSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const existing = await db.query.players.findFirst({
    where: eq(players.userId, session.user.id),
    columns: { id: true },
  });
  if (existing) redirect("/");

  const usernameAvailable = await checkUsernameAvailable(parsed.data.username);
  if (!usernameAvailable) throw new Error("Este username ya está en uso");

  const season = await db.query.seasons.findFirst({
    where: (s, { eq }) => eq(s.isActive, true),
    columns: { id: true },
  });

  const [newPlayer] = await db.insert(players).values({
    userId:          session.user.id,
    username:        parsed.data.username.toLowerCase(),
    displayName:     parsed.data.displayName,
    location:        parsed.data.location,
    position:        parsed.data.position,
    attrAttack:      parsed.data.attrAttack,
    attrDefense:     parsed.data.attrDefense,
    attrVolley:      parsed.data.attrVolley,
    attrConsistency: parsed.data.attrConsistency,
    elo:             1500,
    level:           1,
    xp:              0,
    xpToNextLevel:   1000,
    winStreak:       0,
    totalWins:       0,
    totalLosses:     0,
    seasonId:        season?.id,
  }).returning();

  if (parsed.data.firstFriendId && newPlayer) {
    try {
      await sendFriendRequest(parsed.data.firstFriendId);
    } catch {
      // No bloquear el onboarding si falla la solicitud
    }
  }

  redirect("/");
}
