"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@lib/auth-client";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { GoogleButton } from "@components/auth/google-button";
import { AuthDivider } from "@components/auth/auth-divider";
import { toast } from "sonner";

const loginSchema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    const { error } = await signIn.email({
      email:    data.email,
      password: data.password,
    });
    if (error) {
      toast.error(error.message ?? "Email o contraseña incorrectos");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
            <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>PadelXP</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Track. Compete. Level Up.</p>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 500, marginBottom: "1.25rem" }}>Iniciar sesión</h1>

          <GoogleButton label="Continuar con Google" />

          <AuthDivider />

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" autoComplete="email" {...register("email")}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              {errors.email && <span style={{ fontSize: "12px", color: "var(--red)" }}>{errors.email.message}</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register("password")}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              {errors.password && <span style={{ fontSize: "12px", color: "var(--red)" }}>{errors.password.message}</span>}
            </div>

            <Button type="submit" disabled={loading} style={{ background: "var(--accent)", color: "#fff", border: "none", marginTop: "4px" }}>
              {loading ? "Entrando..." : "Entrar con email"}
            </Button>
          </form>

          <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "1.25rem" }}>
            <p>
              ¿No tienes cuenta?{" "}
              <Link href="/register" style={{ color: "var(--accent-light)", textDecoration: "none" }}>Regístrate</Link>
            </p>
            <p style={{ marginTop: "8px" }}>
              ¿Olvidaste la contraseña?{" "}
              <Link href="/auth/forgot-password" style={{ color: "var(--accent-light)", textDecoration: "none" }}>Recupérala</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
