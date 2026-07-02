"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile } from "@lib/actions/players";
import { toast } from "sonner";
import type { Player } from "@db/schema";

const ProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  location: z.string().max(50).optional(),
});

interface Props {
  player: Player;
}

const inputStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  width: "100%",
};

export function EditProfileForm({ player }: Props) {
  const [loadingProfile, setLoadingProfile] = useState(false);

  const profileForm = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      displayName: player.displayName,
      location: player.location ?? "",
    },
  });

  async function onSaveProfile(data: z.infer<typeof ProfileSchema>) {
    setLoadingProfile(true);
    try {
      await updateProfile(data);
      toast.success("Perfil actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px" }}>
          Datos básicos
        </div>
        <form
          onSubmit={profileForm.handleSubmit(onSaveProfile)}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <div>
            <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Nombre
            </label>
            <input
              {...profileForm.register("displayName")}
              style={{
                ...inputStyle,
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            {profileForm.formState.errors.displayName && (
              <p style={{ color: "var(--red)", fontSize: "11px" }}>
                {profileForm.formState.errors.displayName.message}
              </p>
            )}
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Ubicación
            </label>
            <input
              {...profileForm.register("location")}
              placeholder="Madrid, Barcelona..."
              style={{
                ...inputStyle,
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loadingProfile}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {loadingProfile ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
