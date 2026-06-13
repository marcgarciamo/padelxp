"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { checkUsernameAvailable } from "@lib/actions/onboarding";

const Step1Schema = z.object({
  displayName: z.string().min(2, "Mínimo 2 caracteres").max(50),
  username:    z.string()
                .min(3, "Mínimo 3 caracteres")
                .max(20, "Máximo 20 caracteres")
                .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y _"),
  location:    z.string().max(50).optional(),
});

type Step1Values = z.infer<typeof Step1Schema>;

interface Props {
  defaultValues: Step1Values;
  onNext: (values: Step1Values) => void;
}

const inputStyle = {
  background: "var(--bg-elevated)",
  border:     "1px solid var(--border)",
  color:      "var(--text-primary)",
  width:      "100%",
};

export function OnboardingStep1({ defaultValues, onNext }: Props) {
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Step1Values>({
    resolver: zodResolver(Step1Schema),
    defaultValues,
  });

  const username = watch("username");

  async function handleUsernameBlur() {
    if (!username || username.length < 3) return;
    setUsernameStatus("checking");
    const available = await checkUsernameAvailable(username);
    setUsernameStatus(available ? "available" : "taken");
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>👋</div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
          ¡Bienvenido a PadelXP!
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Primero cuéntanos quién eres
        </p>
      </div>

      <form onSubmit={handleSubmit(onNext)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        <div>
          <Label htmlFor="displayName">Nombre completo</Label>
          <Input
            id="displayName"
            {...register("displayName")}
            placeholder="Lucas Marín"
            style={inputStyle}
            autoComplete="name"
          />
          {errors.displayName && (
            <p style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px" }}>
              {errors.displayName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <div style={{ position: "relative" }}>
            <div style={{
              position:      "absolute",
              left:          "12px",
              top:           "50%",
              transform:     "translateY(-50%)",
              color:         "var(--text-muted)",
              fontSize:      "14px",
              pointerEvents: "none",
            }}>
              @
            </div>
            <Input
              id="username"
              {...register("username")}
              onBlur={handleUsernameBlur}
              placeholder="lucas_m"
              style={{ ...inputStyle, paddingLeft: "28px" }}
              autoComplete="off"
              autoCapitalize="none"
            />
            {usernameStatus !== "idle" && (
              <div style={{
                position:  "absolute",
                right:     "12px",
                top:       "50%",
                transform: "translateY(-50%)",
                fontSize:  "13px",
                color:     usernameStatus === "available" ? "var(--green)"
                         : usernameStatus === "taken"     ? "var(--red)"
                         : "var(--text-muted)",
              }}>
                {usernameStatus === "checking"  && "..."}
                {usernameStatus === "available" && "✓ Disponible"}
                {usernameStatus === "taken"     && "✗ En uso"}
              </div>
            )}
          </div>
          {errors.username && (
            <p style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px" }}>
              {errors.username.message}
            </p>
          )}
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Solo letras minúsculas, números y guión bajo
          </p>
        </div>

        <div>
          <Label htmlFor="location">
            Ciudad{" "}
            <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
          </Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="Madrid, Barcelona..."
            style={inputStyle}
            autoComplete="off"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || usernameStatus === "taken" || usernameStatus === "checking"}
          style={{
            background: "var(--accent)",
            color:      "#fff",
            border:     "none",
            padding:    "14px",
            marginTop:  "8px",
          }}
        >
          Continuar →
        </Button>
      </form>
    </div>
  );
}
