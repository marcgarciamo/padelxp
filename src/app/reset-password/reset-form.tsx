"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { resetPassword, validateResetToken } from "@lib/actions/auth";
import { toast } from "sonner";

export function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function validate() {
      if (!token || token.length !== 64) {
        setIsValid(false);
        return;
      }

      try {
        const result = await validateResetToken(token);
        setIsValid(result);
      } catch {
        setIsValid(false);
      }
    }

    validate();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Completa todos los campos");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (!token) {
      toast.error("Token inválido");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        token,
        newPassword,
        confirmPassword,
      });
      toast.success("Contraseña cambiada. Inicia sesión");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar contraseña");
    } finally {
      setIsLoading(false);
    }
  }

  if (isValid === null) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div>Validando enlace...</div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}>
        <div style={{
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px" }}>
            Enlace inválido o expirado
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            El enlace para recuperar tu contraseña no es válido o ha expirado.
          </p>
          <Link
            href="/forgot-password"
            style={{
              display: "inline-block",
              background: "var(--accent)",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        maxWidth: "400px",
        width: "100%",
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
          Cambiar contraseña
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "14px" }}>
          Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>
              Nueva contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  paddingRight: "40px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: "18px",
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Cambiando..." : "Cambiar contraseña"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-muted)" }}>
          <Link
            href="/login"
            style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
          >
            Volver a login
          </Link>
        </p>
      </div>
    </div>
  );
}
