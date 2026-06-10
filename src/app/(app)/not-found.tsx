import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-primary)" }}>
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎾</div>
      <h2 style={{ fontSize: "20px", fontWeight: 500, marginBottom: "8px" }}>Página no encontrada</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "24px" }}>
        La pista que buscas no existe.
      </p>
      <Link
        href="/"
        style={{ background: "var(--accent)", color: "#000", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", textDecoration: "none", fontWeight: 600 }}
      >
        Volver al feed
      </Link>
    </div>
  );
}
