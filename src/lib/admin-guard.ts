import { getAdminSession } from "@lib/admin-session";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session; // { username: string }
}
