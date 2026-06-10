"use client";

export default function AuthError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "var(--red)", marginBottom: "16px" }}>Error de autenticación</p>
        <button onClick={reset} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: 600 }}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
