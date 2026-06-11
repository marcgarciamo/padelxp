"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { createTournament } from "@lib/actions/tournaments";
import { toast } from "sonner";

export function CreateTournamentForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name:        formData.get("name") as string,
      description: formData.get("description") as string,
      format:      formData.get("format") as "elimination" | "round_robin",
      maxTeams:    Number(formData.get("maxTeams")),
      xpReward:    Number(formData.get("xpReward")),
      startsAt:    formData.get("startsAt") as string || undefined,
    };

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
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label htmlFor="name">Nombre del Torneo</Label>
        <Input
          id="name"
          name="name"
          required
          minLength={3}
          placeholder="Ej: PadelXP Summer Cup"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label htmlFor="description">Descripción (Opcional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="Reglas, premios, ubicación..."
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <Label htmlFor="format">Formato</Label>
          <select
            id="format"
            name="format"
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
            name="maxTeams"
            type="number"
            defaultValue={8}
            min={4}
            max={32}
            required
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <Label htmlFor="xpReward">Premio (XP)</Label>
          <Input
            id="xpReward"
            name="xpReward"
            type="number"
            defaultValue={500}
            min={100}
            required
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <Label htmlFor="startsAt">Fecha Inicio</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
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
