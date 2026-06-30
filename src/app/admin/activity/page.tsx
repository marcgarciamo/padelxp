import { db } from "@db/index";
import { adminActivityLog } from "@db/schema";
import { desc } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const ACTION_LABELS: Record<string, string> = {
  season_created:   "Temporada creada",
  season_updated:   "Temporada editada",
  season_activated: "Temporada activada",
  season_closed:    "Temporada cerrada",
  season_deleted:   "Temporada eliminada",
  player_banned:    "Jugador baneado",
  player_unbanned:  "Jugador desbaneado",
  role_changed:     "Rol cambiado",
  match_resolved:   "Partido resuelto por admin",
};

export default async function AdminActivityPage() {
  const logs = await db.query.adminActivityLog.findMany({
    orderBy: [desc(adminActivityLog.createdAt)],
    limit: 100,
    with: {
      admin: { columns: { displayName: true, avatarUrl: true, role: true } },
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Actividad</h1>
        <p className="text-zinc-500 text-sm mt-1">Log de acciones del panel de administración</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {logs.length === 0 && (
          <p className="text-center py-12 text-zinc-600 text-sm">Sin actividad registrada</p>
        )}
        {logs.map((log) => {
          const details = (log.metadata ?? {}) as Record<string, string>;
          const label = ACTION_LABELS[log.action] ?? log.action;
          const target = details.displayName;
          return (
            <div key={log.id} className="flex items-start gap-3 px-5 py-4">
              <div className="size-8 rounded-full bg-violet-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {log.adminId?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200">
                  <span className="font-medium">{log.adminId ?? "admin"}</span>
                  {" — "}
                  <span className="text-zinc-400">{label}</span>
                  {target && <span className="text-zinc-500"> · {target}</span>}
                </p>
                {details.from && details.to && (
                  <p className="text-xs text-zinc-600 mt-0.5">{String(details.from)} → {String(details.to)}</p>
                )}
              </div>
              <span className="text-xs text-zinc-600 shrink-0 mt-0.5">
                {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { locale: es, addSuffix: true }) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
