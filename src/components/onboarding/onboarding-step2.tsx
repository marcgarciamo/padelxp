"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@components/ui/button";

const Step2Schema = z.object({
  position:        z.enum(["left", "right", "both"]),
  attrAttack:      z.number().min(1).max(100),
  attrDefense:     z.number().min(1).max(100),
  attrVolley:      z.number().min(1).max(100),
  attrConsistency: z.number().min(1).max(100),
});

type Step2Values = z.infer<typeof Step2Schema>;

interface Props {
  defaultValues: Step2Values;
  onNext: (values: Step2Values) => void;
  onBack: () => void;
}

const POSITIONS = [
  { value: "right", label: "Derecha", emoji: "🎯", desc: "Lado derecho de la pista" },
  { value: "left",  label: "Revés",   emoji: "🔄", desc: "Lado izquierdo de la pista" },
  { value: "both",  label: "Ambos",   emoji: "⚡", desc: "Cómodo en ambos lados" },
] as const;

const ATTRS = [
  { key: "attrAttack"      as const, label: "Ataque",       color: "#ef4444", desc: "Potencia de tus golpes ofensivos" },
  { key: "attrDefense"     as const, label: "Defensa",      color: "#0ea5e9", desc: "Capacidad de recuperar bolas difíciles" },
  { key: "attrVolley"      as const, label: "Volea",        color: "#8b5cf6", desc: "Efectividad en la red" },
  { key: "attrConsistency" as const, label: "Consistencia", color: "#22c55e", desc: "Regularidad y menos errores" },
];

export function OnboardingStep2({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, watch, setValue } = useForm<Step2Values>({
    resolver: zodResolver(Step2Schema),
    defaultValues,
  });

  const position = watch("position");
  const attrs    = watch();

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎾</div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
          Tu estilo de juego
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Sé honesto — esto ayuda a calcular mejor tu ELO inicial
        </p>
      </div>

      <form onSubmit={handleSubmit(onNext)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Posición en pista
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {POSITIONS.map((pos) => (
              <div
                key={pos.value}
                onClick={() => setValue("position", pos.value)}
                style={{
                  flex:         1,
                  padding:      "12px 8px",
                  borderRadius: "12px",
                  border:       position === pos.value
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                  background:   position === pos.value
                    ? "rgba(124,92,252,0.1)"
                    : "var(--bg-elevated)",
                  textAlign:    "center",
                  cursor:       "pointer",
                  transition:   "all 0.15s",
                }}
              >
                <div style={{ fontSize: "22px", marginBottom: "4px" }}>{pos.emoji}</div>
                <div style={{
                  fontSize:   "12px",
                  fontWeight: 600,
                  color:      position === pos.value ? "var(--accent-light)" : "var(--text-primary)",
                }}>
                  {pos.label}
                </div>
              </div>
            ))}
          </div>
          <input type="hidden" {...register("position")} />
        </div>

        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Atributos iniciales
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {ATTRS.map((attr) => (
              <div key={attr.key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{attr.label}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>{attr.desc}</span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: attr.color }}>
                    {attrs[attr.key]}
                  </span>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    {...register(attr.key, { valueAsNumber: true })}
                    style={{ width: "100%", accentColor: attr.color, height: "4px" }}
                  />
                  <div style={{
                    position:      "absolute",
                    bottom:        0,
                    left:          0,
                    height:        "4px",
                    width:         `${attrs[attr.key]}%`,
                    background:    attr.color,
                    borderRadius:  "2px",
                    opacity:       0.3,
                    pointerEvents: "none",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding:      "12px 20px",
              borderRadius: "10px",
              border:       "1px solid var(--border)",
              background:   "var(--bg-elevated)",
              color:        "var(--text-muted)",
              fontSize:     "13px",
              cursor:       "pointer",
            }}
          >
            ← Atrás
          </button>
          <Button
            type="submit"
            style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none", padding: "12px" }}
          >
            Continuar →
          </Button>
        </div>
      </form>
    </div>
  );
}
