import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player || !["admin", "moderator"].includes(player.role)) redirect("/");

  return player;
}

export async function requireSuperAdmin() {
  const player = await requireAdmin();
  if (player.role !== "admin") redirect("/admin/dashboard");
  return player;
}
