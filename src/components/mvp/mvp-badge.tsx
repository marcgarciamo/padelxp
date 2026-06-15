interface MvpBadgeProps { count: number; size?: "sm" | "md" }

export function MvpBadge({ count, size = "md" }: MvpBadgeProps) {
  if (count === 0) return null;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))",
      border: "1px solid rgba(245,158,11,0.4)", borderRadius: "20px",
      padding: size === "sm" ? "2px 8px" : "4px 12px",
      fontSize: size === "sm" ? "11px" : "13px",
      fontWeight: 600, color: "var(--gold)",
    }}>
      🌟 {count} MVP{count !== 1 ? "s" : ""}
    </div>
  );
}
