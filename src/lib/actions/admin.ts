"use server";

import { db } from "@db/index";
import { players, adminActivityLog, postmatchFlows, notifications } from "@db/schema";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@lib/admin-session";
import { processCompletedFlow } from "@lib/actions/postmatch";
import { revalidatePath } from "next/cache";

async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) throw new Error("No autenticado");
  return session;
}

async function logActivity(
  adminUsername: string,
  action: string,
  targetId?: string,
  targetType?: string,
  details?: object,
) {
  await db.insert(adminActivityLog).values({
    adminId:    adminUsername,
    action,
    targetId:   targetId ?? null,
    targetType: targetType ?? null,
    metadata:   details ?? {},
  });
}

export async function banPlayerAction(playerId: string, banned: boolean) {
  const admin = await requireAdminSession();
  const target = await db.query.players.findFirst({ where: eq(players.id, playerId) });
  if (!target) throw new Error("Jugador no encontrado");
  await db.update(players).set({ banned }).where(eq(players.id, playerId));
  await logActivity(admin.username, banned ? "player_banned" : "player_unbanned", playerId, "player", { displayName: target.displayName });
  revalidatePath("/admin/users");
}

export async function changeRoleAction(playerId: string, newRole: string) {
  const admin = await requireAdminSession();
  if (!["player", "moderator"].includes(newRole)) throw new Error("Rol inválido");
  const target = await db.query.players.findFirst({ where: eq(players.id, playerId) });
  if (!target) throw new Error("Jugador no encontrado");
  await db.update(players).set({ role: newRole }).where(eq(players.id, playerId));
  await logActivity(admin.username, "role_changed", playerId, "player", { from: target.role, to: newRole, displayName: target.displayName });
  revalidatePath("/admin/users");
}

export async function resolveDisputeAction(
  flowId: string,
  sets: Array<{ team1: number; team2: number }>,
  winner: string,
) {
  const admin = await requireAdminSession();
  const flow = await db.query.postmatchFlows.findFirst({ where: eq(postmatchFlows.id, flowId) });
  if (!flow) throw new Error("Flujo no encontrado");

  await db.update(postmatchFlows).set({
    proposedSets:    sets,
    proposedWinner:  winner,
    status:          "completed",
    completedAt:     new Date(),
  }).where(eq(postmatchFlows.id, flowId));

  await logActivity(admin.username, "match_resolved", flowId, "match", { winner });
  await processCompletedFlow(flowId);
  revalidatePath("/admin/moderation");
}
