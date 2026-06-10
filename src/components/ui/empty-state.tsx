interface EmptyStateProps {
  icon:    string;
  title:   string;
  message: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>{icon}</div>
      <h3 style={{ fontSize: "16px", fontWeight: 500, marginBottom: "6px" }}>{title}</h3>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>{message}</p>
      {action && (
        <a href={action.href} style={{ background: "var(--accent)", color: "#000", padding: "10px 20px", borderRadius: "20px", fontSize: "13px", textDecoration: "none", fontWeight: 600 }}>
          {action.label}
        </a>
      )}
    </div>
  );
}
