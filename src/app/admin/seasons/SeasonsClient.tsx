"use client";

import { useState, useTransition } from "react";
import { Plus, Play, X, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import SeasonDialog from "@components/admin/SeasonDialog";
import CloseSeasonDialog from "@components/admin/CloseSeasonDialog";
import { activateSeasonAction, deleteSeasonAction } from "@lib/actions/seasons";
import type { Season } from "@db/schema";

type Stats = { seasonId: string; playerCount: number; matchCount: number };

type Props = {
  seasons:  Season[];
  statsMap: Record<string, Stats>;
};

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  upcoming: { label: "Próxima",  class: "bg-zinc-700 text-zinc-300" },
  active:   { label: "Activa",   class: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  closed:   { label: "Cerrada",  class: "bg-zinc-800 text-zinc-500" },
};

export default function SeasonsClient({ seasons, statsMap }: Props) {
  const [showCreate, setShowCreate]   = useState(false);
  const [editSeason, setEditSeason]   = useState<Season | null>(null);
  const [closeSeason, setCloseSeason] = useState<Season | null>(null);
  const [pending, startTransition]    = useTransition();

  function handleActivate(id: string) {
    startTransition(async () => {
      try {
        await activateSeasonAction(id);
        toast.success("Temporada activada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      try {
        await deleteSeasonAction(id);
        toast.success("Temporada eliminada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Temporadas</h1>
          <p className="text-zinc-500 text-sm mt-1">Gestiona los ciclos de competición</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="size-4" />
          Nueva Temporada
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Nombre", "Estado", "Inicio", "Fin", "Jugadores", "Partidos", "Acciones"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seasons.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-zinc-600">Sin temporadas creadas</td></tr>
            )}
            {seasons.map((s) => {
              const st = STATUS_LABEL[s.status] ?? STATUS_LABEL.upcoming!;
              const stats = statsMap[s.id];
              return (
                <tr key={s.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-200">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.class}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{format(new Date(s.startDate), "dd MMM yyyy", { locale: es })}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.endDate ? format(new Date(s.endDate), "dd MMM yyyy", { locale: es }) : "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{stats?.playerCount ?? 0}</td>
                  <td className="px-4 py-3 text-zinc-400">{stats?.matchCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {s.status === "upcoming" && (
                        <>
                          <button onClick={() => handleActivate(s.id)} disabled={pending} title="Activar"
                            className="p-1.5 rounded hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400 transition-colors">
                            <Play className="size-3.5" />
                          </button>
                          <button onClick={() => setEditSeason(s)} title="Editar"
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors">
                            <Pencil className="size-3.5" />
                          </button>
                          <button onClick={() => handleDelete(s.id, s.name)} disabled={pending} title="Eliminar"
                            className="p-1.5 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors">
                            <X className="size-3.5" />
                          </button>
                        </>
                      )}
                      {s.status === "active" && (
                        <>
                          <button onClick={() => setEditSeason(s)} title="Editar"
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors">
                            <Pencil className="size-3.5" />
                          </button>
                          <button onClick={() => setCloseSeason(s)} title="Cerrar"
                            className="p-1.5 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors text-xs font-medium px-2">
                            Cerrar
                          </button>
                        </>
                      )}
                      {s.status === "closed" && (
                        <Link href={`/admin/seasons/${s.id}/snapshot`}
                          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1 text-xs">
                          <Eye className="size-3.5" /> Snapshot
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && <SeasonDialog mode="create" onClose={() => setShowCreate(false)} />}
      {editSeason && (
        <SeasonDialog
          mode="edit"
          seasonId={editSeason.id}
          defaults={{
            name:     editSeason.name,
            slug:     editSeason.slug ?? "",
            startsAt: editSeason.startDate.toISOString().slice(0, 10),
            ...(editSeason.endDate ? { endsAt: editSeason.endDate.toISOString().slice(0, 10) } : {}),
          }}
          onClose={() => setEditSeason(null)}
        />
      )}
      {closeSeason && (
        <CloseSeasonDialog
          season={closeSeason}
          players={statsMap[closeSeason.id]?.playerCount ?? 0}
          matches={statsMap[closeSeason.id]?.matchCount ?? 0}
          onClose={() => setCloseSeason(null)}
        />
      )}
    </div>
  );
}
