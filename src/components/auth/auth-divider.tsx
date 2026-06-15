export function AuthDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        o continúa con email
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}
