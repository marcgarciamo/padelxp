"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { resolveDisputeAction } from "@lib/actions/admin";

type Validation = {
  id: string; confirms: boolean;
  altSets?: Array<{ team1: number; team2: number }> | null;
  altWinner?: string | null;
  player: { id: string; displayName: string; avatarUrl: string | null };
};

type Flow = {
  id: string; matchId: string; matchType: string; status: string;
  createdAt: Date; expiresAt: Date;
  proposedSets?: Array<{ team1: number; team2: number }> | null;
  proposedWinner?: string | null;
  validations: Validation[];
};

export default function ModerationCard({ flow }: { flow: Flow }) {
  const [selected, setSelected] = useState<string>("original");
  const [pending, startTransition] = useTransition();

  const proposals: Array<{ key: string; label: string; sets: Array<{ team1: number; team2: number }>; winner: string }> = [];
  if (flow.proposedSets && flow.proposedWinner) {
    proposals.push({
      key: "original",
      label: "Propuesta original",
      sets: flow.proposedSets,
      winner: flow.proposedWinner,
    });
  }
  flow.validations.filter((v) => !v.confirms && v.altSets && v.altWinner).forEach((v, i) => {
    proposals.push({
      key: `alt_${i}`,
      label: `Alternativa de ${v.player.displayName}`,
      sets: v.altSets!,
      winner: v.altWinner!,
    });
  });

  function handleResolve() {
    const proposal = proposals.find((p) => p.key === selected);
    if (!proposal) return;
    if (!confirm(`Resolver partido con "${proposal.label}"?`)) return;
    startTransition(async () => {
      try {
        await resolveDisputeAction(flow.id, proposal.sets, proposal.winner);
        toast.success("Disputa resuelta");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-mono">{flow.matchId}</p>
          <p className="text-zinc-400 text-xs mt-0.5">
            Creado {formatDistanceToNow(new Date(flow.createdAt), { locale: es, addSuffix: true })}
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          Disputado
        </span>
      </div>

      {/* Validations */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Votos</p>
        {flow.validations.map((v) => (
          <div key={v.id} className="flex items-center gap-3 text-sm">
            {v.player.avatarUrl
              ? <img src={v.player.avatarUrl} alt="" className="size-6 rounded-full object-cover" />
              : <div className="size-6 rounded-full bg-violet-800 flex items-center justify-center text-xs font-bold">{v.player.displayName[0]}</div>
            }
            <span className="text-zinc-300 text-xs">{v.player.displayName}</span>
            {v.confirms
              ? <span className="text-xs text-emerald-400">Confirma</span>
              : <span className="text-xs text-red-400">
                  Disputa {v.altSets ? `(${v.altSets.map((s) => `${s.team1}-${s.team2}`).join(", ")} · ${v.altWinner === "team1" ? "E1 gana" : "E2 gana"})` : ""}
                </span>
            }
          </div>
        ))}
      </div>

      {/* Proposal selector */}
      {proposals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Resultado a aplicar</p>
          <div className="space-y-2">
            {proposals.map((p) => (
              <label key={p.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`flow-${flow.id}`}
                  value={p.key}
                  checked={selected === p.key}
                  onChange={() => setSelected(p.key)}
                  className="accent-violet-500"
                />
                <span className="text-xs text-zinc-300">
                  <span className="text-zinc-500">{p.label}:</span>{" "}
                  {p.sets.map((s) => `${s.team1}-${s.team2}`).join(", ")}
                  {" · "}
                  {p.winner === "team1" ? "Equipo 1 gana" : "Equipo 2 gana"}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleResolve}
        disabled={pending || proposals.length === 0}
        className="w-full py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-lg transition-colors"
      >
        {pending ? "Aplicando..." : "Forzar resolución"}
      </button>
    </div>
  );
}
