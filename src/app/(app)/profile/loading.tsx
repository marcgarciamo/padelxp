export default function Loading() {
  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className="card" style={{ height: "180px", opacity: 0.5, animation: "skeleton-pulse 1.5s infinite" }} />
      <div className="card" style={{ height: "120px", opacity: 0.5, animation: "skeleton-pulse 1.5s infinite" }} />
      <div className="card" style={{ height: "200px", opacity: 0.5, animation: "skeleton-pulse 1.5s infinite" }} />
    </div>
  );
}
