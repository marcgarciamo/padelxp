import { requireAdmin } from "@lib/admin-guard";
import AdminSidebar from "@components/admin/AdminSidebar";
import { db } from "@db/index";
import { seasons } from "@db/schema";
import { eq } from "drizzle-orm";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  const activeSeason = await db.query.seasons.findFirst({
    where: eq(seasons.status, "active"),
    columns: { id: true, name: true },
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <AdminSidebar admin={admin} activeSeason={activeSeason ?? null} />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="md:hidden bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-xs text-yellow-400 text-center">
          Panel de administración optimizado para escritorio
        </div>
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
