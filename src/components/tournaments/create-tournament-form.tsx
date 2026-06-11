"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { createTournament } from "@lib/actions/tournaments";
import { toast } from "sonner";

const CreateTournamentSchema = z.object({
  name:        z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  format:      z.enum(["elimination", "round_robin"]),
  maxTeams:    z.number().min(4, "Mínimo 4 equipos").max(32, "Máximo 32 equipos"),
  xpReward:    z.number().min(100, "La recompensa debe ser de al menos 100 XP"),
  startsAt:    z.string().optional(),
});

type FormData = z.infer<typeof CreateTournamentSchema>;

export function CreateTournamentForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(CreateTournamentSchema),
    defaultValues: {
      format: "elimination",
      maxTeams: 8,
      xpReward: 500,
    }
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const t = await createTournament(data);
        if (!t) throw new Error("Error inesperado al crear el torneo");
        toast.success("¡Torneo creado con éxito!");
        router.push(`/tournaments/${t.id}`);
      } catch (error: any) {
        toast.error(error.message || "Error al crear el torneo");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label htmlFor="name">Nombre del Torneo</Label>
        <Input
          id="name"
          placeholder="Ej: PadelXP Summer Cup"
          {...register("name")}
          style={{ background: "var(--bg-elevated)", border: errors.name ? "1px solid var(--red)" : "1px solid var(--border)", color: "var(--text-primary)" }}
        />
        {errors.name && <span style={{ fontSize: "11px", color: "var(--red)" }}>{errors.name.message}</span>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label htmlFor="description">Descripción (Opcional)</Label>
        <Input
          id="description"
          placeholder="Reglas, premios, ubicación..."
          {...register("description")}
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <Label htmlFor="format">Formato</Label>
          <select
            id="format"
            {...register("format")}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          >
            <option value="elimination">Eliminatoria</option>
            <option value="round_robin">Todos contra todos</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <Label htmlFor="maxTeams">Max. Equipos</Label>
          <Input
            id="maxTeams"
            type="number"
            {...register("maxTeams", { valueAsNumber: true })}
            style={{ background: "var(--bg-elevated)", border: errors.maxTeams ? "1px solid var(--red)" : "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          {errors.maxTeams && <span style={{ fontSize: "11px", color: "var(--red)" }}>{errors.maxTeams.message}</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <Label htmlFor="xpReward">Premio (XP)</Label>
          <Input
            id="xpReward"
            type="number"
            {...register("xpReward", { valueAsNumber: true })}
            style={{ background: "var(--bg-elevated)", border: errors.xpReward ? "1px solid var(--red)" : "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          {errors.xpReward && <span style={{ fontSize: "11px", color: "var(--red)" }}>{errors.xpReward.message}</span>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <Label htmlFor="startsAt">Fecha Inicio</Label>
          <Input
            id="startsAt"
            type="datetime-local"
            {...register("startsAt")}
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", colorScheme: "dark" }}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="btn-primary"
        style={{ border: "none", marginTop: "0.5rem" }}
      >
        {isPending ? "Creando..." : "Crear Torneo"}
      </Button>
    </form>
  );
}
