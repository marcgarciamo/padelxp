"use client";

import { useState, useMemo, useTransition } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel,
  getPaginationRowModel, flexRender, type SortingState } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { banPlayerAction, changeRoleAction } from "@lib/actions/admin";

type Player = {
  id: string; displayName: string; username: string; avatarUrl: string | null;
  level: number; elo: number; totalWins: number; totalLosses: number;
  role: string; banned: boolean; createdAt: Date; mvpCount: number;
  attrAttack: number; attrDefense: number; attrVolley: number;
  attrConsistency: number; attrBandeja: number; attrRemate: number;
};

export default function UsersClient({ players }: { players: Player[] }) {
  const [sorting, setSorting]         = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pending, startTransition]    = useTransition();

  function handleBan(id: string, banned: boolean, name: string) {
    const action = banned ? "desbanear" : "banear";
    if (!confirm(`¿${action} a ${name}?`)) return;
    startTransition(async () => {
      try {
        await banPlayerAction(id, !banned);
        toast.success(`${name} ${!banned ? "baneado" : "desbaneado"}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleRole(id: string, newRole: string, name: string) {
    startTransition(async () => {
      try {
        await changeRoleAction(id, newRole);
        toast.success(`${name} ahora es ${newRole}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (roleFilter !== "all" && p.role !== roleFilter) return false;
      if (statusFilter === "active" && p.banned) return false;
      if (statusFilter === "banned" && !p.banned) return false;
      return true;
    });
  }, [players, roleFilter, statusFilter]);

  const columns = useMemo(() => [
    {
      id: "player",
      accessorKey: "displayName",
      header: "Jugador",
      cell: ({ row }: any) => {
        const p = row.original as Player;
        const media = Math.round((p.attrAttack + p.attrDefense + p.attrVolley + p.attrConsistency + p.attrBandeja + p.attrRemate) / 6);
        return (
          <div className="flex items-center gap-2">
            {p.avatarUrl
              ? <img src={p.avatarUrl} alt="" className="size-7 rounded-full object-cover" />
              : <div className="size-7 rounded-full bg-violet-800 flex items-center justify-center text-xs font-bold">{p.displayName[0]}</div>
            }
            <div>
              <p className="text-zinc-200 font-medium text-sm">{p.displayName}</p>
              <p className="text-xs text-zinc-500">@{p.username} · Media {media}</p>
            </div>
          </div>
        );
      },
    },
    { accessorKey: "level",     header: "Nv.", cell: ({ getValue }: any) => <span className="text-zinc-400 text-sm">Nv.{getValue()}</span> },
    { accessorKey: "totalWins", header: "W",   cell: ({ getValue }: any) => <span className="text-emerald-400 text-sm">{getValue()}</span> },
    { accessorKey: "totalLosses", header: "L", cell: ({ getValue }: any) => <span className="text-red-400 text-sm">{getValue()}</span> },
    {
      id: "role",
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: any) => {
        const p = row.original as Player;
        return (
          <select
            defaultValue={p.role}
            onChange={(e) => handleRole(p.id, e.target.value, p.displayName)}
            disabled={pending}
            className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 rounded px-2 py-1 focus:outline-none"
          >
            <option value="player">player</option>
            <option value="moderator">moderator</option>
            <option value="admin">admin</option>
          </select>
        );
      },
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }: any) => {
        const p = row.original as Player;
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.banned ? "bg-red-500/20 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            {p.banned ? "Baneado" : "Activo"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }: any) => {
        const p = row.original as Player;
        return (
          <div className="flex items-center gap-1">
            <Link href={`/admin/users/${p.id}`} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors" title="Ver detalle">
              <Eye className="size-3.5" />
            </Link>
            <button
              onClick={() => handleBan(p.id, p.banned, p.displayName)}
              disabled={pending}
              className={`text-xs px-2 py-1 rounded ${p.banned ? "hover:bg-emerald-500/10 hover:text-emerald-400" : "hover:bg-red-500/10 hover:text-red-400"} text-zinc-500 transition-colors`}
            >
              {p.banned ? "Desbanear" : "Banear"}
            </button>
          </div>
        );
      },
    },
  ], [pending]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const select = "bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none";

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Jugadores</h1>
        <p className="text-zinc-500 text-sm mt-1">{players.length} jugadores registrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar por nombre o username..."
          className="bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none placeholder-zinc-600 w-64"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={select}>
          <option value="all">Todos los roles</option>
          <option value="player">player</option>
          <option value="moderator">moderator</option>
          <option value="admin">admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={select}>
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="banned">Baneados</option>
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-zinc-800">
                {hg.headers.map((h) => (
                  <th key={h.id} className="text-left text-xs font-medium text-zinc-500 px-4 py-3">
                    {h.isPlaceholder ? null : (
                      <button
                        onClick={h.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
                      >
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

        {/* Pagination */}
        <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} · {filtered.length} jugadores
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
