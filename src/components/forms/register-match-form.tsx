"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMatch } from "@lib/actions/matches";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Avatar } from "@components/player/avatar";
import { avatarColor } from "@lib/utils";
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

const inputBase: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  width: "100%",
};

function InlineAvatar({ name, src, size }: { name: string; src: string | null | undefined; size: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(" ").map(w => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
  const bg = avatarColor(name);

  if (src && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }}
      />
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.32), fontWeight: 500, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function PlayerPicker({
  players,
  value,
  onChange,
  placeholder,
  error,
}: {
  players: Player[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  error?: string | undefined;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = players.find((p) => p.id === value);
  const filtered = players.filter((p) =>
    p.displayName.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (selected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", border: `1px solid ${error ? "var(--red)" : "var(--accent)"}`, borderRadius: "10px", background: "var(--bg-elevated)" }}>
        <InlineAvatar name={selected.displayName} src={selected.avatarUrl} size={28} />
        <span style={{ fontSize: "13px", fontWeight: 500 }}>{selected.displayName}</span>
        <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto" }}>ELO {selected.elo}</span>
        <button type="button" onClick={() => onChange("")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 2px" }}>×</button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <Input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{ ...inputBase, padding: "9px 12px", borderRadius: "10px", border: error ? "1px solid var(--red)" : "1px solid var(--border)" }}
      />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: "10px", maxHeight: "220px", overflowY: "auto", zIndex: 50 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "12px", color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>Sin resultados</div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                onMouseDown={() => { onChange(p.id); setOpen(false); setSearch(""); }}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", cursor: "pointer", background: hoveredId === p.id ? "var(--bg-primary)" : "transparent", transition: "background 0.1s" }}
              >
                <InlineAvatar name={p.displayName} src={p.avatarUrl} size={28} />
                <span style={{ fontSize: "13px" }}>{p.displayName}</span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto" }}>ELO {p.elo}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function RegisterMatchForm({ currentPlayer, availablePlayers }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

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
      router.push(`/postmatch/${result.flowId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar el partido");
      setLoading(false);
    }
  }

  const inputStyle = { ...inputBase };

  return (
    <>
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
            <Avatar name={currentPlayer.displayName} src={currentPlayer.avatarUrl} size={28} />
            <span style={{ fontSize: "13px", fontWeight: 500 }}>{currentPlayer.displayName}</span>
            <span style={{ fontSize: "10px", color: "var(--accent-light)", marginLeft: "auto" }}>Tú</span>
          </div>
          <Controller
            name="partnerId"
            control={control}
            render={({ field }) => (
              <PlayerPicker
                players={availablePlayers}
                value={field.value}
                onChange={field.onChange}
                placeholder="Buscar compañero..."
                error={errors.partnerId?.message}
              />
            )}
          />
          {errors.partnerId && <p style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px" }}>{errors.partnerId.message}</p>}
        </div>

        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>— vs —</div>

        <div className="card" style={{ padding: "12px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>RIVALES</div>
          <div style={{ marginBottom: "8px" }}>
            <Controller
              name="opponent1Id"
              control={control}
              render={({ field }) => (
                <PlayerPicker
                  players={availablePlayers}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Buscar rival 1..."
                  error={errors.opponent1Id?.message}
                />
              )}
            />
            {errors.opponent1Id && <p style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px" }}>{errors.opponent1Id.message}</p>}
          </div>
          <Controller
            name="opponent2Id"
            control={control}
            render={({ field }) => (
              <PlayerPicker
                players={availablePlayers}
                value={field.value}
                onChange={field.onChange}
                placeholder="Buscar rival 2..."
                error={errors.opponent2Id?.message}
              />
            )}
          />
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
          {fields.map((_, i) => (
            errors.sets?.[i]?.root && (
              <p key={`err-${i}`} style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px" }}>
                Set {i + 1}: {(errors.sets[i] as any)?.root?.message ?? "Set inválido"}
              </p>
            )
          ))}
          {errors.sets?.root && (
            <p style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px" }}>
              {(errors.sets as any)?.root?.message}
            </p>
          )}
          {fields.length < 3 && (
            <button type="button" onClick={() => append({ team1: 6, team2: 4 })} style={{ fontSize: "12px", color: "var(--accent-light)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              + Añadir set
            </button>
          )}
        </div>

        {errors.root && (
          <p style={{ color: "var(--red)", fontSize: "12px", textAlign: "center" }}>{errors.root.message}</p>
        )}

        <Button type="submit" disabled={loading} className="btn-primary" style={{ border: "none", padding: "14px" }}>
          {loading ? "Guardando..." : "Guardar partido"}
        </Button>
      </form>
    </>
  );
}
