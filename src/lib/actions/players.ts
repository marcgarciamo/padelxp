"use server";

import { db } from "@db/index";
import { players } from "@db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getPlayerByUserId } from "@lib/queries/players";

export async function updateAvatar(base64Image: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autorizado");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) throw new Error("Jugador no encontrado");

  // Validar tamaño aproximado (Base64 es ~33% más grande que el original)
  // Limitamos a ~500KB para evitar saturar la DB (Drizzle/Postgres manejan bien texto largo, pero mejor prevenir)
  if (base64Image.length > 700000) {
    throw new Error("La imagen es demasiado grande. Máximo 500KB.");
  }

  await db.update(players)
    .set({ avatarUrl: base64Image, updatedAt: new Date() })
    .where(eq(players.id, player.id));

  revalidatePath("/profile");
  revalidatePath(`/profile/card`);
}
