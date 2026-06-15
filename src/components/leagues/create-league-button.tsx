"use client";

import { useState, useTransition } from "react";
import { createLeague } from "@lib/actions/leagues";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CreateLeagueButton() {
  const [open, setOpen]             = useState(false);
  const [name, setName]             = useState("");
  const [description, setDescription] = useState("");
  const [xpPerWin, setXpPerWin]     = useState(150);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCreate() {
    if (!name.trim()) { toast.error("Escribe un nombre para la liga"); return; }
    startTransition(async () => {
      try {
        const league = await createLeague({ name, description: description || undefined, xpPerWin });
        toast.success("Liga creada ✓");
        setOpen(false);
        if (league) router.push(`/leagues/${league.id}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al crear la liga");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
      >
        + Nueva liga
      </button>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div style={{ background: "var(--bg-elevated)", borderRadius: "16px 16px 0 0", padding: "24px", width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ fontSize: "16px", fontWeight: 600 }}>Nueva liga</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Nombre *</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Liga de verano 2026"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", color: "var(--text-primary)", outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Descripción (opcional)</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Liga informal de pádel entre amigos..."
            rows={2}
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "var(--text-primary)", resize: "none", outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>XP por victoria ({xpPerWin})</label>
          <input
            type="range" min="50" max="500" step="50" value={xpPerWin}
            onChange={(e) => setXpPerWin(+e.target.value)}
            style={{ accentColor: "var(--accent)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
            <span>50</span><span>500</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <button onClick={() => setOpen(false)} style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={handleCreate} disabled={isPending} style={{ flex: 2, background: "var(--accent)", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            {isPending ? "Creando..." : "Crear liga"}
          </button>
        </div>
      </div>
    </div>
  );
}
