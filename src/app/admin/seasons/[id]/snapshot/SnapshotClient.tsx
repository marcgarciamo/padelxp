"use client";

import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Season, SeasonSnapshot } from "@db/schema";

type SnapshotWithPlayer = SeasonSnapshot & {
  player: { displayName: string; avatarUrl: string | null; username: string };
};

type Props = {
  season:    Season;
  snapshots: SnapshotWithPlayer[];
};

export default function SnapshotClient({ season, snapshots }: Props) {
  function exportCSV() {
    const headers = ["Pos", "Jugador", "Media Global", "ELO", "Victorias", "Derrotas", "MVPs", "XP", "Nivel"];
    const rows = snapshots.map((s) => [
      s.rankPosition ?? "",
      s.player.displayName,
      s.finalMediaGlobal,
      s.finalElo,
      s.totalWins,
      s.totalLosses,
      s.mvpCount,
      s.finalXp,
      s.finalLevel,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `snapshot-${season.slug ?? season.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const medal = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/seasons" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mb-2">
            <ArrowLeft className="size-3" /> Temporadas
          </Link>
          <h1 className="text-2xl font-bold text-white">{season.name}</h1>
          <p className="text-zinc-500 text-sm mt-1">Clasificación final · {snapshots.length} jugadores</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
        >
          <Download className="size-4" /> Exportar CSV
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Pos", "Jugador", "Media", "ELO", "Victorias", "Derrotas", "MVPs", "Nivel"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshots.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-zinc-600">Sin datos en este snapshot</td></tr>
            )}
            {snapshots.map((s) => (
              <tr key={s.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                <td className="px-4 py-3 text-zinc-400 font-mono">
                  {medal[(s.rankPosition ?? 0) - 1] ?? s.rankPosition}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {s.player.avatarUrl ? (
                      <img src={s.player.avatarUrl} alt="" className="size-7 rounded-full object-cover" />
                    ) : (
                      <div className="size-7 rounded-full bg-violet-800 flex items-center justify-center text-xs font-bold text-white">
                        {s.player.displayName[0]}
                      </div>
                    )}
                    <span className="text-zinc-200 font-medium">{s.player.displayName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-violet-400 font-mono">{Number(s.finalMediaGlobal).toFixed(0)}</td>
                <td className="px-4 py-3 text-zinc-400 font-mono">{s.finalElo}</td>
                <td className="px-4 py-3 text-emerald-400">{s.totalWins}</td>
                <td className="px-4 py-3 text-red-400">{s.totalLosses}</td>
                <td className="px-4 py-3 text-yellow-400">{s.mvpCount} ⭐</td>
                <td className="px-4 py-3 text-zinc-400">Nv.{s.finalLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
