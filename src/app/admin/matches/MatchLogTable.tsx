"use client";

import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel,
  getPaginationRowModel, flexRender, type SortingState } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

type MatchRow = {
  id: string; createdAt: Date; playedAt: Date; venue: string;
  winnerTeam: "team1" | "team2";
  sets: Array<{ team1: number; team2: number }>;
  team1EloDelta: number; team2EloDelta: number;
  team1XpGained: number; team2XpGained: number;
  team1Player1: { displayName: string; avatarUrl: string | null } | null;
  team1Player2: { displayName: string; avatarUrl: string | null } | null;
  team2Player1: { displayName: string; avatarUrl: string | null } | null;
  team2Player2: { displayName: string; avatarUrl: string | null } | null;
};

type FlowMap = Record<string, { id: string; matchId: string; status: string }>;

const STATUS_STYLE: Record<string, string> = {
  completed:          "text-emerald-400",
  pending_validation: "text-yellow-400",
  pending_voting:     "text-blue-400",
  pending_result:     "text-zinc-500",
  expired:            "text-red-400",
};
const STATUS_LABEL: Record<string, string> = {
  completed:          "Completo",
  pending_validation: "Validando",
  pending_voting:     "Votando",
  pending_result:     "Pendiente",
  expired:            "Expirado",
};

export default function MatchLogTable({ matches, flowMap }: { matches: MatchRow[]; flowMap: FlowMap }) {
  const [sorting, setSorting]       = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(() => [
    {
      id: "createdAt",
      accessorFn: (r: MatchRow) => r.createdAt,
      header: "Fecha",
      cell: ({ row }: any) => (
        <span className="text-zinc-400 text-xs font-mono">
          {format(new Date(row.original.createdAt), "dd/MM/yy HH:mm", { locale: es })}
        </span>
      ),
    },
    {
      id: "players",
      header: "Jugadores",
      accessorFn: (r: MatchRow) =>
        [r.team1Player1, r.team1Player2, r.team2Player1, r.team2Player2]
          .map((p) => p?.displayName ?? "").join(" "),
      cell: ({ row }: any) => {
        const m = row.original as MatchRow;
        const t1 = [m.team1Player1?.displayName, m.team1Player2?.displayName].filter(Boolean).join(" + ");
        const t2 = [m.team2Player1?.displayName, m.team2Player2?.displayName].filter(Boolean).join(" + ");
        return (
          <div className="text-xs">
            <span className={m.winnerTeam === "team1" ? "text-emerald-400 font-medium" : "text-zinc-400"}>{t1}</span>
            <span className="text-zinc-600 mx-1">vs</span>
            <span className={m.winnerTeam === "team2" ? "text-emerald-400 font-medium" : "text-zinc-400"}>{t2}</span>
          </div>
        );
      },
    },
    {
      id: "sets",
      header: "Sets",
      cell: ({ row }: any) => {
        const m = row.original as MatchRow;
        return (
          <span className="text-zinc-400 text-xs font-mono">
            {m.sets.map((s) => `${s.team1}-${s.team2}`).join(", ")}
          </span>
        );
      },
    },
    {
      id: "venue",
      accessorKey: "venue",
      header: "Pista",
      cell: ({ getValue }: any) => <span className="text-zinc-500 text-xs">{getValue()}</span>,
    },
    {
      id: "flow",
      header: "Flow",
      cell: ({ row }: any) => {
        const m = row.original as MatchRow;
        const flow = flowMap[m.id];
        if (!flow) return <span className="text-zinc-700 text-xs">—</span>;
        const style = STATUS_STYLE[flow.status] ?? "text-zinc-400";
        const label = STATUS_LABEL[flow.status] ?? flow.status;
        return <span className={`text-xs ${style}`}>{label}</span>;
      },
    },
  ], [flowMap]);

  const table = useReactTable({
    data: matches,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Partidos</h1>
        <p className="text-zinc-500 text-sm mt-1">{matches.length} partidos registrados</p>
      </div>

      <input
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Buscar jugador o pista..."
        className="bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none placeholder-zinc-600 w-72"
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-zinc-800">
                {hg.headers.map((h) => (
                  <th key={h.id} className="text-left text-xs font-medium text-zinc-500 px-4 py-3">
                    {h.isPlaceholder ? null : (
                      <button onClick={h.column.getToggleSortingHandler()} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === "asc"  ? <ChevronUp className="size-3" />   :
                         h.column.getIsSorted() === "desc" ? <ChevronDown className="size-3" /> :
                         h.column.getCanSort()             ? <ChevronsUpDown className="size-3 opacity-30" /> : null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-zinc-600 text-sm">Sin partidos</td></tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
              className="text-xs px-3 py-1 rounded bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700 transition-colors">
              Anterior
            </button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
              className="text-xs px-3 py-1 rounded bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700 transition-colors">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
