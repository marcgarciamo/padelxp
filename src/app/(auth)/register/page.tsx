"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@lib/auth-client";
import { createPlayerProfile } from "@lib/actions/players";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { toast } from "sonner";

const registerSchema = z.object({
  name:     z.string().min(2, "Mínimo 2 caracteres"),
  email:    z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Las contraseñas no coinciden",
  path: ["confirm"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterForm) {
    setLoading(true);
    const { data: authData, error } = await signUp.email({
      email:    data.email,
      password: data.password,
      name:     data.name,
    });
    if (error) {
      toast.error(error.message ?? "Error al registrarse");
      setLoading(false);
      return;
    }

    if (authData?.user) {
      const profileResult = await createPlayerProfile(authData.user.id, authData.user.name);
      if (!profileResult.success) {
        console.error("Profile creation failed:", profileResult.error);
        toast.error(`Error al crear perfil: ${profileResult.error}`);
      }
    }

    toast.success("Cuenta creada. Bienvenido a PadelXP.");
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
    }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }}></span>
            <span style={{ fontSize: "18px", fontWeight: 500 }}>PadelXP</span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Track. Compete. Level Up.</p>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 500, marginBottom: "1.5rem" }}>Crear cuenta</h1>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Lucas Marín"
                autoComplete="name"
                {...register("name")}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
              {errors.name && <span style={{ fontSize: "12px", color: "var(--red)" }}>{errors.name.message}</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                {...register("email")}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
              {errors.email && <span style={{ fontSize: "12px", color: "var(--red)" }}>{errors.email.message}</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("password")}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
              {errors.password && <span style={{ fontSize: "12px", color: "var(--red)" }}>{errors.password.message}</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("confirm")}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
              {errors.confirm && <span style={{ fontSize: "12px", color: "var(--red)" }}>{errors.confirm.message}</span>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ border: "none", marginTop: "0.5rem" }}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "1.25rem" }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" style={{ color: "var(--accent-light)" }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
