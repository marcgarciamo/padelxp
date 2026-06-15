"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { createLeague, type CreateLeagueInput } from "@lib/actions/leagues";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { toast } from "sonner";
import {
  MATCH_FORMAT_LABELS,
  SCORING_SYSTEM_LABELS,
  COURT_MANAGEMENT_LABELS,
  TEAM_FORMAT_LABELS,
} from "@lib/league-utils";

type Step = 1 | 2 | 3;

const DEFAULTS: CreateLeagueInput = {
  name:                "",
  description:         "",
  visibility:          "public",
  teamFormat:          "fixed_pairs",
  maxParticipants:     16,
  totalRounds:         0,
  startDate:           "",
  courtManagement:     "decentralized",
  matchFormat:         "best_of_3",
  scoringSystem:       "golden_point",
  pointsWin:           3,
  pointsLoss:          0,
  pointsWo:            0,
  gamificationEnabled: true,
  xpPerWin:            150,
};

export function CreateLeagueStepper() {
  const router = useRouter();
  const [step, setStep]    = useState<Step>(1);
  const [data, setData]    = useState<CreateLeagueInput>(DEFAULTS);
  const [isPending, start] = useTransition();

  function update(patch: Partial<CreateLeagueInput>) {
    setData((d) => ({ ...d, ...patch }));
  }

  function handleCreate() {
    if (!data.name.trim()) { toast.error("El nombre de la liga es obligatorio"); return; }
    start(async () => {
      try {
        const league = await createLeague(data);
        toast.success(`Liga "${league?.name}" creada${league?.inviteCode ? ` · Código: ${league.inviteCode}` : ""}`);
        router.push(`/leagues/${league?.id}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al crear la liga");
      }
    });
  }

  const inputStyle = {
    background: "var(--bg-elevated)",
    border:     "1px solid var(--border)",
    color:      "var(--text-primary)",
    width:      "100%",
  };

  return (
    <div>
      {/* Indicador de pasos */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
        {([1, 2, 3] as Step[]).map((n) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background:  step >= n ? "var(--accent)" : "var(--bg-elevated)",
              border:      step >= n ? "none" : "1px solid var(--border)",
              display:     "flex", alignItems: "center", justifyContent: "center",
              fontSize:    "12px", fontWeight: 600,
              color:       step >= n ? "#fff" : "var(--text-muted)",
              flexShrink:  0,
              transition:  "all 0.2s",
            }}>
              {n}
            </div>
            <div style={{ flex: 1, height: 2, background: step > n ? "var(--accent)" : "var(--bg-elevated)", borderRadius: 1, transition: "background 0.3s" }} />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── PASO 1: Identidad ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <div style={{ marginBottom: "8px" }}>
              <p style={{ fontSize: "11px", color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Paso 1 de 3</p>
              <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Identidad de la liga</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Lo básico para identificar tu liga</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
              <div>
                <Label>Nombre de la liga *</Label>
                <Input
                  value={data.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Liga Padel Empresa 2025"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div>
                <Label>Descripción <span style={{ color: "var(--text-muted)" }}>(opcional)</span></Label>
                <textarea
                  value={data.description ?? ""}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="Liga mensual entre compañeros del trabajo..."
                  rows={2}
                  style={{ ...inputStyle, borderRadius: "8px", padding: "10px 12px", resize: "vertical", fontFamily: "inherit", fontSize: "13px" }}
                />
              </div>

              <div>
                <Label>Visibilidad</Label>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  {([
                    { value: "public",  label: "🌍 Pública",  desc: "Cualquiera puede unirse" },
                    { value: "private", label: "🔒 Privada",  desc: "Solo con código de invitación" },
                  ] as const).map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => update({ visibility: opt.value })}
                      style={{
                        flex: 1, padding: "12px", borderRadius: "12px", cursor: "pointer",
                        border:     data.visibility === opt.value ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: data.visibility === opt.value ? "rgba(124,92,252,0.1)" : "var(--bg-elevated)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: 600, color: data.visibility === opt.value ? "var(--accent-light)" : "var(--text-primary)" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
                {data.visibility === "private" && (
                  <p style={{ fontSize: "11px", color: "var(--accent-light)", marginTop: "6px" }}>
                    Se generará un código de invitación automáticamente al crear la liga
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={() => {
                if (!data.name.trim()) { toast.error("El nombre es obligatorio"); return; }
                setStep(2);
              }}
              style={{ width: "100%", marginTop: "24px", background: "var(--accent)", color: "#fff", border: "none", padding: "14px" }}
            >
              Siguiente →
            </Button>
          </motion.div>
        )}

        {/* ── PASO 2: Logística ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <div style={{ marginBottom: "8px" }}>
              <p style={{ fontSize: "11px", color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Paso 2 de 3</p>
              <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Formato y logística</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Cómo se organiza la competición</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
              <div>
                <Label>Tipo de participación</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                  {(Object.entries(TEAM_FORMAT_LABELS) as [string, string][]).map(([value, label]) => (
                    <div
                      key={value}
                      onClick={() => update({ teamFormat: value as "fixed_pairs" | "individual" })}
                      style={{
                        padding: "12px 14px", borderRadius: "12px", cursor: "pointer",
                        border:     data.teamFormat === value ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: data.teamFormat === value ? "rgba(124,92,252,0.1)" : "var(--bg-elevated)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: 500, color: data.teamFormat === value ? "var(--accent-light)" : "var(--text-primary)" }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Máximo de participantes</Label>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                  {(data.teamFormat === "fixed_pairs" ? [8, 12, 16, 20, 24] : [8, 12, 16, 20, 24, 32]).map((n) => (
                    <div
                      key={n}
                      onClick={() => update({ maxParticipants: n })}
                      style={{
                        padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px",
                        border:     data.maxParticipants === n ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: data.maxParticipants === n ? "var(--accent)" : "var(--bg-elevated)",
                        color:      data.maxParticipants === n ? "#fff" : "var(--text-muted)",
                        fontWeight: data.maxParticipants === n ? 600 : 400,
                        transition: "all 0.15s",
                      }}
                    >
                      {n}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                  {data.teamFormat === "fixed_pairs"
                    ? `${data.maxParticipants / 2} parejas · ${data.maxParticipants} jugadores`
                    : `${data.maxParticipants} jugadores individuales`}
                </p>
              </div>

              <div>
                <Label>Fecha de inicio <span style={{ color: "var(--text-muted)" }}>(opcional)</span></Label>
                <Input
                  type="date"
                  value={data.startDate ?? ""}
                  onChange={(e) => update({ startDate: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <Label>Gestión de pistas</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                  {(Object.entries(COURT_MANAGEMENT_LABELS) as [string, string][]).map(([value, label]) => (
                    <div
                      key={value}
                      onClick={() => update({ courtManagement: value as "centralized" | "decentralized" })}
                      style={{
                        padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                        border:     data.courtManagement === value ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: data.courtManagement === value ? "rgba(124,92,252,0.1)" : "var(--bg-elevated)",
                        fontSize:   "13px",
                        color:      data.courtManagement === value ? "var(--accent-light)" : "var(--text-primary)",
                        transition: "all 0.15s",
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
              <Button onClick={() => setStep(1)} style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", padding: "12px 20px" }}>
                ← Atrás
              </Button>
              <Button onClick={() => setStep(3)} style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none", padding: "14px" }}>
                Siguiente →
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── PASO 3: Reglas ── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <div style={{ marginBottom: "8px" }}>
              <p style={{ fontSize: "11px", color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Paso 3 de 3</p>
              <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Reglas de juego</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>El reglamento de tu liga</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
              <div>
                <Label>Formato del partido</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                  {(Object.entries(MATCH_FORMAT_LABELS) as [string, string][]).map(([value, label]) => (
                    <div
                      key={value}
                      onClick={() => update({ matchFormat: value as typeof data.matchFormat })}
                      style={{
                        padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                        border:     data.matchFormat === value ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: data.matchFormat === value ? "rgba(124,92,252,0.1)" : "var(--bg-elevated)",
                        fontSize:   "13px",
                        color:      data.matchFormat === value ? "var(--accent-light)" : "var(--text-primary)",
                        transition: "all 0.15s",
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Sistema de puntuación</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                  {(Object.entries(SCORING_SYSTEM_LABELS) as [string, string][]).map(([value, label]) => (
                    <div
                      key={value}
                      onClick={() => update({ scoringSystem: value as typeof data.scoringSystem })}
                      style={{
                        padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                        border:     data.scoringSystem === value ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: data.scoringSystem === value ? "rgba(124,92,252,0.1)" : "var(--bg-elevated)",
                        fontSize:   "13px",
                        color:      data.scoringSystem === value ? "var(--accent-light)" : "var(--text-primary)",
                        transition: "all 0.15s",
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Puntos por resultado</Label>
                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  {([
                    { key: "pointsWin",  label: "Victoria" },
                    { key: "pointsLoss", label: "Derrota" },
                    { key: "pointsWo",   label: "W.O." },
                  ] as const).map(({ key, label }) => (
                    <div key={key} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</div>
                      <input
                        type="number" min="0" max="10"
                        value={data[key]}
                        onChange={(e) => update({ [key]: +e.target.value })}
                        style={{ ...inputStyle, textAlign: "center", padding: "8px", fontSize: "18px", fontWeight: 700, borderRadius: "10px" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div
                onClick={() => update({ gamificationEnabled: !data.gamificationEnabled })}
                style={{
                  padding: "14px", borderRadius: "14px", cursor: "pointer",
                  border:     data.gamificationEnabled ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: data.gamificationEnabled ? "rgba(124,92,252,0.08)" : "var(--bg-elevated)",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: data.gamificationEnabled ? "var(--accent-light)" : "var(--text-primary)" }}>
                      ⚡ Módulo PadelXP activado
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                      MVP, XP, subida de nivel y cartas dinámicas
                    </div>
                  </div>
                  <div style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: data.gamificationEnabled ? "var(--accent)" : "var(--bg-primary)",
                    border: "1px solid var(--border)", position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}>
                    <div style={{
                      position: "absolute", top: 3, left: data.gamificationEnabled ? 23 : 3,
                      width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                    }} />
                  </div>
                </div>
                {data.gamificationEnabled && (
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>XP por victoria:</span>
                    <input
                      type="number" min="0" max="500"
                      value={data.xpPerWin}
                      onChange={(e) => { e.stopPropagation(); update({ xpPerWin: +e.target.value }); }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: "70px", textAlign: "center", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "4px 8px", color: "var(--accent-light)", fontSize: "14px", fontWeight: 700 }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Resumen */}
            <div style={{ marginTop: "16px", padding: "12px 14px", background: "var(--bg-elevated)", borderRadius: "10px", fontSize: "11px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>Resumen de tu liga</div>
              <div>📛 {data.name || "Sin nombre"}</div>
              <div>{data.visibility === "private" ? "🔒 Privada" : "🌍 Pública"} · {data.teamFormat === "fixed_pairs" ? "Parejas fijas" : "Individual"} · {data.maxParticipants} participantes</div>
              <div>{MATCH_FORMAT_LABELS[data.matchFormat]} · {SCORING_SYSTEM_LABELS[data.scoringSystem]}</div>
              <div>{data.pointsWin}V / {data.pointsLoss}D / {data.pointsWo}WO · {data.gamificationEnabled ? `⚡ Gamificación ON (${data.xpPerWin}XP)` : "Gamificación OFF"}</div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <Button onClick={() => setStep(2)} style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", padding: "12px 20px" }}>
                ← Atrás
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isPending}
                style={{ flex: 1, background: "linear-gradient(135deg, var(--accent), #a78bfa)", color: "#fff", border: "none", padding: "14px", fontWeight: 700 }}
              >
                {isPending ? "Creando..." : "🏆 Crear liga"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
