"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordReset } from "@lib/actions/auth";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Ingresa tu email");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset({ email });
      setSubmitted(true);
      toast.success("Revisa tu email para continuar");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar");
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
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
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px" }}>
            Revisa tu email
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            Hemos enviado un enlace a <strong>{email}</strong> para recuperar tu contraseña. El enlace es válido por 1 hora.
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
            ¿No recibiste el email? Revisa tu carpeta de spam.
          </p>
          <Link
            href="/login"
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
            Volver a login
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
          He olvidado mi contraseña
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "14px" }}>
          Ingresa tu email y te enviaremos un enlace para recuperar tu contraseña.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
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
            {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-muted)" }}>
          ¿Recuerdas tu contraseña?{" "}
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
