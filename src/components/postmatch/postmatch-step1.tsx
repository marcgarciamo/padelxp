"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validateResult } from "@lib/actions/postmatch";
import { toast } from "sonner";

interface Props {
  flow:          any;
  currentPlayer: any;
  myCompletion:  any;
  isCreator:     boolean;
  onNext:        () => void;
}

export function PostmatchStep1({ flow, currentPlayer, myCompletion, isCreator, onNext }: Props) {
  const router                       = useRouter();
  const [confirms, setConfirms]      = useState<boolean | null>(null);
  const [altSets, setAltSets]        = useState<Array<{ team1: number; team2: number }>>(
    flow.proposedSets ?? [{ team1: 6, team2: 4 }]
  );
  const [altWinner, setAltWinner]    = useState<"team1" | "team2">(flow.proposedWinner ?? "team1");
  const [isPending, startTransition] = useTransition();

  if (myCompletion.validated && flow.status === "pending_validation") {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Esperando confirmaciones</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
          {flow.validationsCount}/4 jugadores han confirmado el resultado.
          Cuando todos validen, podrás votar el MVP.
        </p>
        <button
          onClick={() => router.refresh()}
          style={{
            padding: "12px 24px", borderRadius: "10px", border: "1px solid var(--border)",
            background: "var(--bg-elevated)", color: "var(--text-primary)",
            fontSize: "14px", cursor: "pointer",
          }}
        >
          🔄 Actualizar
        </button>
      </div>
    );
  }

  const proposedSets   = flow.proposedSets as Array<{ team1: number; team2: number }> ?? [];
  const proposedWinner = flow.proposedWinner as "team1" | "team2";

  function handleSubmit() {
    if (confirms === null) { toast.error("Indica si confirmas el resultado"); return; }
    startTransition(async () => {
      try {
        const result = await validateResult({
          flowId:    flow.id,
          confirms,
          altSets:   confirms ? undefined : altSets,
          altWinner: confirms ? undefined : altWinner,
        });
        toast.success("¡Resultado validado!");
        if ((result?.validationsCount ?? 0) >= 4) {
          onNext();
        } else {
          router.refresh();
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al validar");
      }
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "6px" }}>
        ¿Cómo ha quedado el partido?
      </h2>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
        El resultado fue subido por {flow.createdBy === currentPlayer.id ? "ti" : "tu compañero"}.
        Confirma o corrige si es incorrecto.
      </p>

      <div className="card-elevated" style={{ padding: "16px", marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Resultado propuesto
        </div>
        {proposedSets.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", width: "40px" }}>Set {i + 1}</span>
            <span style={{
              fontSize: "28px", fontWeight: 700,
              color: s.team1 > s.team2 ? "var(--green)" : "var(--text-muted)",
            }}>{s.team1}</span>
            <span style={{ color: "var(--text-muted)" }}>—</span>
            <span style={{
              fontSize: "28px", fontWeight: 700,
              color: s.team2 > s.team1 ? "var(--green)" : "var(--text-muted)",
            }}>{s.team2}</span>
          </div>
        ))}
        <div style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
          Ganador: <strong style={{ color: "var(--green)" }}>
            {proposedWinner === "team1" ? "Pareja A" : "Pareja B"}
          </strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <div
          onClick={() => setConfirms(true)}
          style={{
            flex: 1, padding: "14px", borderRadius: "12px", cursor: "pointer", textAlign: "center",
            border:     confirms === true ? "2px solid var(--green)" : "1px solid var(--border)",
            background: confirms === true ? "rgba(34,197,94,0.1)" : "var(--bg-elevated)",
            transition: "all 0.15s",
          }}
        >
          <div style={{ fontSize: "22px", marginBottom: "4px" }}>✅</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: confirms === true ? "var(--green)" : "var(--text-primary)" }}>
            Confirmar
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>El resultado es correcto</div>
        </div>
        <div
          onClick={() => setConfirms(false)}
          style={{
            flex: 1, padding: "14px", borderRadius: "12px", cursor: "pointer", textAlign: "center",
            border:     confirms === false ? "2px solid var(--red)" : "1px solid var(--border)",
            background: confirms === false ? "rgba(239,68,68,0.1)" : "var(--bg-elevated)",
            transition: "all 0.15s",
          }}
        >
          <div style={{ fontSize: "22px", marginBottom: "4px" }}>✏️</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: confirms === false ? "var(--red)" : "var(--text-primary)" }}>
            Corregir
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>El resultado es diferente</div>
        </div>
      </div>

      {confirms === false && (
        <div className="card" style={{ padding: "14px", marginBottom: "16px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>Introduce el resultado correcto:</div>
          {altSets.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", width: "40px" }}>Set {i + 1}</span>
              <input type="number" min="0" max="7" value={s.team1}
                onChange={(e) => { const n = [...altSets]; n[i] = { ...n[i]!, team1: +e.target.value }; setAltSets(n); }}
                style={{ width: "48px", textAlign: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px", color: "var(--text-primary)", fontSize: "16px", fontWeight: 700 }} />
              <span style={{ color: "var(--text-muted)" }}>—</span>
              <input type="number" min="0" max="7" value={s.team2}
                onChange={(e) => { const n = [...altSets]; n[i] = { ...n[i]!, team2: +e.target.value }; setAltSets(n); }}
                style={{ width: "48px", textAlign: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px", color: "var(--text-primary)", fontSize: "16px", fontWeight: 700 }} />
            </div>
          ))}
          <div style={{ marginTop: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>Ganador:</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["team1", "team2"] as const).map((t) => (
                <div key={t} onClick={() => setAltWinner(t)} style={{
                  flex: 1, padding: "8px", borderRadius: "8px", cursor: "pointer", textAlign: "center", fontSize: "12px",
                  border:     altWinner === t ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: altWinner === t ? "rgba(124,92,252,0.1)" : "var(--bg-elevated)",
                  color:      altWinner === t ? "var(--accent-light)" : "var(--text-muted)",
                }}>
                  {t === "team1" ? "Pareja A" : "Pareja B"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending || confirms === null}
        style={{
          width: "100%", padding: "14px", borderRadius: "12px", border: "none",
          background:  confirms !== null ? "var(--accent)" : "var(--bg-elevated)",
          color:       confirms !== null ? "#fff" : "var(--text-muted)",
          fontSize:    "14px", fontWeight: 600, cursor: confirms !== null ? "pointer" : "not-allowed",
        }}
      >
        {isPending ? "Validando..." : "Siguiente →"}
      </button>

      <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "10px" }}>
        {flow.validationsCount}/4 jugadores han validado
      </p>
    </div>
  );
}
