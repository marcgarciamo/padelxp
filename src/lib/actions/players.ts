"use server";

import { db } from "@db/index";
import { players } from "@db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  location: z.string().max(50).optional(),
});

export async function updateProfile(
  input: z.infer<typeof UpdateProfileSchema>
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  await db
    .update(players)
    .set({
      displayName: parsed.data.displayName,
      location: parsed.data.location ?? player.location,
      updatedAt: new Date(),
    })
    .where(eq(players.id, player.id));

  revalidatePath("/profile");
  revalidatePath("/");
}

const UpdateAttributesSchema = z.object({
  attrAttack: z.number().min(1).max(100),
  attrDefense: z.number().min(1).max(100),
  attrVolley: z.number().min(1).max(100),
  attrConsistency: z.number().min(1).max(100),
});

export async function updateAttributes(
  input: z.infer<typeof UpdateAttributesSchema>
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const parsed = UpdateAttributesSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  const totalMatches = player.totalWins + player.totalLosses;
  if (totalMatches >= 3) {
    throw new Error(
      "Los atributos solo se pueden editar en los primeros 3 partidos"
    );
  }

  await db
    .update(players)
    .set({
      attrAttack: parsed.data.attrAttack,
      attrDefense: parsed.data.attrDefense,
      attrVolley: parsed.data.attrVolley,
      attrConsistency: parsed.data.attrConsistency,
      updatedAt: new Date(),
    })
    .where(eq(players.id, player.id));

  revalidatePath("/profile");
}

export async function updateAvatar(avatarUrl: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  await db
    .update(players)
    .set({
      avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(players.id, player.id));

  revalidatePath("/profile");
  revalidatePath("/");
}
