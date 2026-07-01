"use client";

import { useState, useEffect, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function RecalculateButton() {
  const [open, setOpen]         = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleConfirm() {
    setOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/recalculate", { method: "POST" });
        if (!res.ok) throw new Error("failed");
        toast.success("ELO recalculado correctamente");
        setCooldown(30);
      } catch {
        toast.error("Error al recalcular. Inténtalo de nuevo.");
      }
    });
  }

  const disabled = pending || cooldown > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
        {cooldown > 0 ? `Espera ${cooldown}s…` : "Recalcular ELO"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl mx-4">
            <h2 className="text-lg font-bold text-white mb-2">¿Recalcular ELO global?</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Este proceso recalcula el ELO y Media Global de todos los jugadores
              basándose en el historial completo de partidos. Puede tardar varios segundos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm text-white font-medium transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
