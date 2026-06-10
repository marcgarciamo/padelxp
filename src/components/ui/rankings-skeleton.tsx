import { Skeleton } from "./skeleton";

export function RankingsSkeleton() {
  return (
    <div style={{ padding: "1.25rem" }}>
      <Skeleton width={120} height={28} style={{ marginBottom: "16px" }} />
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="card" style={{ padding: "12px 14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
          <Skeleton width={28} height={28} radius={4} />
          <Skeleton width={36} height={36} radius={18} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <Skeleton width="50%" height={14} />
            <Skeleton width="35%" height={11} />
          </div>
          <Skeleton width={48} height={24} />
        </div>
      ))}
    </div>
  );
}
