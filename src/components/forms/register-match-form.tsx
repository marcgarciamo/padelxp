"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMatch } from "@lib/actions/matches";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Avatar } from "@components/player/avatar";
import { LevelUpCelebration } from "@components/ui/level-up-celebration";
import type { Player } from "@db/schema";

const FormSchema = z.object({
  venue:       z.string().min(2, "Mínimo 2 caracteres"),
  playedAt:    z.string(),
  partnerId:   z.string().uuid("Selecciona un compañero"),
  opponent1Id: z.string().uuid("Selecciona el rival 1"),
  opponent2Id: z.string().uuid("Selecciona el rival 2"),
  sets: z.array(z.object({
    team1: z.number().min(0).max(7),
    team2: z.number().min(0).max(7),
  }).refine(
    (set) => {
      const diff = Math.abs(set.team1 - set.team2);
      const winner = Math.max(set.team1, set.team2);
      return winner >= 6 && diff >= 2;
    },
    "Set inválido: ganador debe tener 6+ puntos con 2+ de diferencia"
  )).min(1).max(3),
}).refine(
  (data) => {
    let team1Wins = 0;
    let team2Wins = 0;
    for (const set of data.sets) {
      if (set.team1 > set.team2) team1Wins++;
      else team2Wins++;
    }
    return team1Wins > 0 || team2Wins > 0;
  },
  "Al menos un equipo debe ganar un set"
);

type FormValues = {
  venue: string;
  playedAt: string;
  partnerId: string;
  opponent1Id: string;
  opponent2Id: string;
  sets: { team1: number; team2: number }[];
};

interface Props {
  currentPlayer:    Player;
  availablePlayers: Player[];
}

export function RegisterMatchForm({ currentPlayer, availablePlayers }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      venue: "",
      playedAt: new Date().toISOString().split("T")[0]!,
      partnerId: "",
      opponent1Id: "",
      opponent2Id: "",
      sets: [{ team1: 6, team2: 4 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "sets" });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const result = await createMatch(data);
      if (result.newLevel && result.newLevel > result.oldLevel) {
        setLevelUp(result.newLevel);
      } else {
        toast.success(`Partido guardado! +${result.xpGained} XP · ELO ${result.eloDelta >= 0 ? "+" : ""}${result.eloDelta}`);
        router.push("/matches");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar el partido");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", width: "100%" };

  return (
    <>
      {levelUp && (
        <LevelUpCelebration
          newLevel={levelUp}
          onDone={() => { setLevelUp(null); router.push("/matches"); }}
        />
      )}
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <Label>Club / Pista</Label>
          <Input {...register("venue")} placeholder="Club Pádel Madrid" style={{ ...inputStyle, border: errors.venue ? "1px solid var(--red)" : "1px solid var(--border)" }} />
          {errors.venue && <p style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px" }}>{errors.venue.message}</p>}
        </div>

        <div>
          <Label>Fecha</Label>
          <Input {...register("playedAt")} type="date" style={{ ...inputStyle, border: errors.playedAt ? "1px solid var(--red)" : "1px solid var(--border)" }} />
          {errors.playedAt && <p style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px" }}>{errors.playedAt.message}</p>}
        </div>

        <div className="card" style={{ padding: "12px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>TU EQUIPO</div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", border: "1px solid var(--accent)", borderRadius: "10px", marginBottom: "8px" }}>
            <Avatar name={currentPlayer.displayName} size={28} />
            <span style={{ fontSize: "13px", fontWeight: 500 }}>{currentPlayer.displayName}</span>
            <span style={{ fontSize: "10px", color: "var(--accent-light)", marginLeft: "auto" }}>Tú</span>
          </div>
          <select {...register("partnerId")} style={{ ...inputStyle, padding: "9px 12px", borderRadius: "10px", border: errors.partnerId ? "1px solid var(--red)" : "1px solid var(--border)" }}>
            <option value="">Selecciona compañero...</option>
            {availablePlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName} (ELO {p.elo})</option>
            ))}
          </select>
          {errors.partnerId && <p style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px" }}>{errors.partnerId.message}</p>}
        </div>

        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>— vs —</div>

        <div className="card" style={{ padding: "12px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>RIVALES</div>
          <select {...register("opponent1Id")} style={{ ...inputStyle, padding: "9px 12px", borderRadius: "10px", marginBottom: "8px", border: errors.opponent1Id ? "1px solid var(--red)" : "1px solid var(--border)" }}>
            <option value="">Rival 1...</option>
            {availablePlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName} (ELO {p.elo})</option>
            ))}
          </select>
          {errors.opponent1Id && <p style={{ color: "var(--red)", fontSize: "11px", marginTop: "-4px", marginBottom: "8px" }}>{errors.opponent1Id.message}</p>}
          
          <select {...register("opponent2Id")} style={{ ...inputStyle, padding: "9px 12px", borderRadius: "10px", border: errors.opponent2Id ? "1px solid var(--red)" : "1px solid var(--border)" }}>
            <option value="">Rival 2...</option>
            {availablePlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName} (ELO {p.elo})</option>
            ))}
          </select>
          {errors.opponent2Id && <p style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px" }}>{errors.opponent2Id.message}</p>}
        </div>

        <div className="card" style={{ padding: "12px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>MARCADOR</div>
          {fields.map((field, i) => (
            <div key={field.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", width: "40px" }}>Set {i + 1}</span>
              <Input {...register(`sets.${i}.team1` as const, { valueAsNumber: true })} type="number" min="0" max="7" style={{ ...inputStyle, width: "52px", textAlign: "center", padding: "8px" }} />
              <span style={{ color: "var(--text-muted)" }}>—</span>
              <Input {...register(`sets.${i}.team2` as const, { valueAsNumber: true })} type="number" min="0" max="7" style={{ ...inputStyle, width: "52px", textAlign: "center", padding: "8px" }} />
              {i > 0 && (
                <button type="button" onClick={() => remove(i)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: "16px" }}>×</button>
              )}
            </div>
          ))}
          {fields.length < 3 && (
            <button type="button" onClick={() => append({ team1: 6, team2: 4 })} style={{ fontSize: "12px", color: "var(--accent-light)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              + Añadir set
            </button>
          )}
        </div>

        <Button type="submit" disabled={loading} className="btn-primary" style={{ border: "none", padding: "14px" }}>
          {loading ? "Guardando..." : "Guardar partido"}
        </Button>
      </form>
    </>
  );
}
