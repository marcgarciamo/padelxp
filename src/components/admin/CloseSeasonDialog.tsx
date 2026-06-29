"use client";

import { useState, useTransition } from "react";
import { closeSeasonAction } from "@lib/actions/seasons";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

type Props = {
  season:  { id: string; name: string };
  players: number;
  matches: number;
  onClose: () => void;
};

export default function CloseSeasonDialog({ season, players, matches, onClose }: Props) {
  const [checked, setChecked]   = useState(false);
  const [confirm, setConfirm]   = useState("");
  const [pending, startTransition] = useTransition();

  const canSubmit = checked && confirm === season.name;

  function handleClose() {
    startTransition(async () => {
      try {
        await closeSeasonAction(season.id);
        toast.success(`Temporada "${season.name}" cerrada. ${players} jugadores notificados.`);
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al cerrar la temporada");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle className="size-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold text-white">Cerrar temporada</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Vas a cerrar <span className="text-white font-medium">"{season.name}"</span>
            </p>
          </div>
        </div>

        <div className="bg-zinc-800/50 rounded-xl p-4 mb-5 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Jugadores afectados</span>
            <span className="text-white font-medium">{players}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Partidos registrados</span>
            <span className="text-white font-medium">{matches}</span>
          </div>
          <div className="pt-2 border-t border-zinc-700 text-xs text-zinc-500 space-y-1">
            <p>· Se guardarán snapshots de rankings finales</p>
            <p>· ELO, wins, losses, racha y MVPs se resetearán a 0</p>
            <p>· XP, nivel y atributos NO se resetean</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 accent-red-500"
            />
            <span className="text-sm text-zinc-400">
              Entiendo que esta acción es <strong className="text-red-400">irreversible</strong>
            </span>
          </label>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">
              Escribe <strong className="text-zinc-300">{season.name}</strong> para confirmar
            </label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={season.name}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleClose}
            disabled={!canSubmit || pending}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {pending ? "Cerrando..." : "Cerrar Temporada"}
          </button>
        </div>
      </div>
    </div>
  );
}
