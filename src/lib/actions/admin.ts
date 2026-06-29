"use server";

import { db } from "@db/index";
import { players, adminActivityLog, postmatchFlows, notifications } from "@db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@lib/auth";
import { getPlayerByUserId } from "@lib/queries/players";
import { processCompletedFlow } from "@lib/actions/postmatch";
import { revalidatePath } from "next/cache";

async function getAdminPlayer() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autenticado");
  const player = await getPlayerByUserId(session.user.id);
  if (!player || !["admin", "moderator"].includes(player.role)) throw new Error("Sin permisos");
  return player;
}

async function logActivity(adminId: string, action: string, targetId?: string, targetType?: string, details?: object) {
  await db.insert(adminActivityLog).values({
    adminId,
    action,
    targetId: targetId ?? null,
    targetType: targetType ?? null,
    metadata: details ?? {},
  });
}

export async function banPlayerAction(playerId: string, banned: boolean) {
  const admin = await getAdminPlayer();
  const target = await db.query.players.findFirst({ where: eq(players.id, playerId) });
  if (!target) throw new Error("Jugador no encontrado");
  if (target.role === "admin") throw new Error("No puedes banear a un admin");
  await db.update(players).set({ banned }).where(eq(players.id, playerId));
  await logActivity(admin.id, banned ? "player_banned" : "player_unbanned", playerId, "player", { displayName: target.displayName });
  revalidatePath("/admin/users");
}

export async function changeRoleAction(playerId: string, newRole: string) {
  const admin = await getAdminPlayer();
  if (!["player", "moderator", "admin"].includes(newRole)) throw new Error("Rol inválido");
  if (admin.role !== "admin" && newRole === "admin") throw new Error("Solo admins pueden asignar rol admin");
  const target = await db.query.players.findFirst({ where: eq(players.id, playerId) });
  if (!target) throw new Error("Jugador no encontrado");
  await db.update(players).set({ role: newRole }).where(eq(players.id, playerId));
  await logActivity(admin.id, "role_changed", playerId, "player", { from: target.role, to: newRole, displayName: target.displayName });
  revalidatePath("/admin/users");
}

export async function resolveDisputeAction(
  flowId: string,
  sets: Array<{ team1: number; team2: number }>,
  winner: string,
) {
  const admin = await getAdminPlayer();
  const flow = await db.query.postmatchFlows.findFirst({ where: eq(postmatchFlows.id, flowId) });
  if (!flow) throw new Error("Flujo no encontrado");

  await db.update(postmatchFlows).set({
    proposedSets:  sets,
    proposedWinner: winner,
    status:         "completed",
    completedAt:    new Date(),
  }).where(eq(postmatchFlows.id, flowId));

  await logActivity(admin.id, "match_resolved", flowId, "match", { winner });
  await processCompletedFlow(flowId);
  revalidatePath("/admin/moderation");
}
