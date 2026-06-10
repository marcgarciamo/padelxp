import { Skeleton } from "./skeleton";

export function FeedSkeleton() {
  return (
    <div style={{ padding: "1.25rem" }}>
      {/* Hero card skeleton */}
      <div className="card-elevated" style={{ padding: "18px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
          <Skeleton width={52} height={52} radius={26} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <Skeleton width="60%" height={22} />
            <Skeleton width="40%" height={14} />
            <Skeleton width="80%" height={20} radius={20} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "14px" }}>
          {[1,2,3,4].map(i => <Skeleton key={i} height={56} radius={10} />)}
        </div>
        <Skeleton height={6} radius={3} />
      </div>
      {/* Match skeletons */}
      {[1,2,3].map(i => (
        <div key={i} className="card" style={{ padding: "14px", marginBottom: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Skeleton width="50%" height={12} />
            <Skeleton height={16} />
            <Skeleton width="30%" height={20} />
          </div>
        </div>
      ))}
    </div>
  );
}
