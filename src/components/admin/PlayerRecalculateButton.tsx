"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calculator } from "lucide-react";
import { toast } from "sonner";

export default function PlayerRecalculateButton({ playerId }: { playerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${playerId}/recalculate`, { method: "POST" });
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as { mediaGlobal: number };
        toast.success(`Media Global: ${data.mediaGlobal}`);
        router.refresh();
      } catch {
        toast.error("Error al recalcular. Inténtalo de nuevo.");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full"
    >
      <Calculator className="size-4 shrink-0" />
      {pending ? "Calculando…" : "Recalcular Media Global"}
    </button>
  );
}
