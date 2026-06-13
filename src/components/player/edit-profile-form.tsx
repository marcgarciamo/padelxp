"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile, updateAttributes } from "@lib/actions/players";
import { toast } from "sonner";
import type { Player } from "@db/schema";

const ProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  location: z.string().max(50).optional(),
});

const AttributesSchema = z.object({
  attrAttack: z.number().min(1).max(100),
  attrDefense: z.number().min(1).max(100),
  attrVolley: z.number().min(1).max(100),
  attrConsistency: z.number().min(1).max(100),
});

interface Props {
  player: Player;
}

type AttributesFormType = {
  attrAttack: number;
  attrDefense: number;
  attrVolley: number;
  attrConsistency: number;
};

const inputStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  width: "100%",
};

export function EditProfileForm({ player }: Props) {
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingAttrs, setLoadingAttrs] = useState(false);
  const canEditAttrs = player.totalWins + player.totalLosses < 3;

  const profileForm = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      displayName: player.displayName,
      location: player.location ?? "",
    },
  });

  const attrForm = useForm<AttributesFormType>({
    resolver: zodResolver(AttributesSchema),
    defaultValues: {
      attrAttack: player.attrAttack,
      attrDefense: player.attrDefense,
      attrVolley: player.attrVolley,
      attrConsistency: player.attrConsistency,
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

  async function onSaveAttrs(data: AttributesFormType) {
    setLoadingAttrs(true);
    try {
      await updateAttributes(data);
      toast.success("Atributos actualizados");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingAttrs(false);
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

      <div className="card" style={{ padding: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 500 }}>Atributos</div>
          {!canEditAttrs && (
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                background: "var(--bg-elevated)",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              Bloqueado tras 3 partidos
            </span>
          )}
        </div>
        <form
          onSubmit={attrForm.handleSubmit(onSaveAttrs)}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          {[
            {
              key: "attrAttack" as const,
              label: "Ataque",
              color: "#ef4444",
            },
            {
              key: "attrDefense" as const,
              label: "Defensa",
              color: "#0ea5e9",
            },
            {
              key: "attrVolley" as const,
              label: "Volea",
              color: "#8b5cf6",
            },
            {
              key: "attrConsistency" as const,
              label: "Consistencia",
              color: "#22c55e",
            },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <label
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "11px",
                  }}
                >
                  {label}
                </label>
                <span style={{ fontSize: "11px", color }}>
                  {attrForm.watch(key)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                disabled={!canEditAttrs}
                {...attrForm.register(key)}
                style={{
                  width: "100%",
                  accentColor: color,
                  opacity: canEditAttrs ? 1 : 0.4,
                }}
              />
            </div>
          ))}
          {canEditAttrs && (
            <button
              type="submit"
              disabled={loadingAttrs}
              style={{
                background: "var(--bg-elevated)",
                color: "var(--accent-light)",
                border: "1px solid rgba(124,92,252,0.3)",
                padding: "10px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {loadingAttrs ? "Guardando..." : "Guardar atributos"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
