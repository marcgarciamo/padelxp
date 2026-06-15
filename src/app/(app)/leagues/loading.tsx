export default function Loading() {
  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div className="card" style={{ height: "40px", width: "140px", opacity: 0.5, animation: "skeleton-pulse 1.5s infinite" }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="card" style={{ height: "90px", opacity: 0.5, animation: "skeleton-pulse 1.5s infinite" }} />
      ))}
    </div>
  );
}
