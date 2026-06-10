"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const router = useRouter();

  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-primary)" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
      <h2 style={{ fontSize: "18px", fontWeight: 500, marginBottom: "8px" }}>Algo ha fallado</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "24px" }}>
        {error.message ?? "Error inesperado. Por favor inténtalo de nuevo."}
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
        >
          Reintentar
        </button>
        <button
          onClick={() => router.push("/")}
          style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontSize: "13px" }}
        >
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
