"use client";

import { useState, useTransition } from "react";
import { joinLeagueByCode } from "@lib/actions/leagues";
import { Input } from "@components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function JoinByCodeForm() {
  const [code, setCode]              = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleJoin() {
    if (code.length !== 8) { toast.error("El código debe tener 8 caracteres"); return; }
    startTransition(async () => {
      try {
        const league = await joinLeagueByCode(code);
        toast.success("¡Te has unido a la liga!");
        router.push(`/leagues/${league?.id}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Código inválido");
      }
    });
  }

  return (
    <div className="card" style={{ padding: "16px", marginBottom: "16px" }}>
      <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "10px" }}>
        🔒 Unirse con código de invitación
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
          placeholder="XXXXXXXX"
          maxLength={8}
          style={{
            flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)",
            color: "var(--text-primary)", fontFamily: "monospace", fontSize: "16px",
            letterSpacing: "0.2em", textTransform: "uppercase",
          }}
        />
        <button
          onClick={handleJoin}
          disabled={isPending || code.length !== 8}
          style={{
            background: code.length === 8 ? "var(--accent)" : "var(--bg-elevated)",
            color:      code.length === 8 ? "#fff" : "var(--text-muted)",
            border:     "none", borderRadius: "10px", padding: "0 16px",
            fontSize:   "13px", fontWeight: 500,
            cursor:     code.length === 8 ? "pointer" : "not-allowed",
          }}
        >
          {isPending ? "..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}
