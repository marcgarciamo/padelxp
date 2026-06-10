"use client";

interface SkeletonProps {
  width?:  string | number;
  height?: string | number;
  radius?: string | number;
  style?:  React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, radius = 6, style }: SkeletonProps) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background:   "var(--bg-elevated)",
      animation:    "skeleton-pulse 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}
