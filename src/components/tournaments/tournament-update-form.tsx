"use client";

import { useState } from "react";
import { updateTournament } from "@lib/actions/tournaments";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { toast } from "sonner";

interface Props {
  tournamentId: string;
  initialData: any;
  onSuccess: () => void;
}

export function TournamentUpdateForm({ tournamentId, initialData, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    maxTeams: number;
    xpReward: number;
    startsAt: string | undefined;
  }>({
    name:        initialData.name,
    description: initialData.description || "",
    maxTeams:    initialData.maxTeams,
    xpReward:    initialData.xpReward,
    startsAt:    initialData.startsAt ? new Date(initialData.startsAt).toISOString().split("T")[0] : undefined,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateTournament(tournamentId, formData);
      toast.success("Torneo actualizado");
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setLoading(false);
    }
  }

  const isClosed = initialData.status !== "open";
  const inputStyle = { background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", width: "100%" };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <Label>Nombre del torneo</Label>
        <Input 
          value={formData.name} 
          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
          style={inputStyle}
          required
        />
      </div>

      <div>
        <Label>Descripción</Label>
        <textarea 
          value={formData.description} 
          onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
          style={{ ...inputStyle, padding: "8px", borderRadius: "8px", minHeight: "80px", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <Label>Máx. Equipos</Label>
          <Input 
            type="number" 
            value={formData.maxTeams} 
            onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })} 
            style={inputStyle}
            disabled={isClosed}
            min={4}
            max={32}
          />
        </div>
        <div>
          <Label>Recompensa XP</Label>
          <Input 
            type="number" 
            value={formData.xpReward} 
            onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })} 
            style={inputStyle}
            disabled={isClosed}
            min={100}
          />
        </div>
      </div>

      <div>
        <Label>Fecha de inicio</Label>
        <Input 
          type="date" 
          value={formData.startsAt || ""} 
          onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })} 
          style={inputStyle}
          disabled={isClosed}
        />
      </div>

      {isClosed && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
          * Algunas opciones están bloqueadas porque el torneo ya ha comenzado o finalizado.
        </p>
      )}

      <Button type="submit" disabled={loading} className="btn-primary" style={{ border: "none", marginTop: "8px" }}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
