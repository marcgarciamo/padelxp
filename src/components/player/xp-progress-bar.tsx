"use client";

import { useEffect, useState } from "react";

interface XpProgressBarProps {
  current: number;
  total:   number;
  level:   number;
}

export function XpProgressBar({ current, total, level }: XpProgressBarProps) {
  const [width, setWidth] = useState(0);
  const percent = Math.min((current / total) * 100, 100);

  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 100);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "5px" }}>
        <span>XP al nivel {level + 1}</span>
        <span>{current.toLocaleString()} / {total.toLocaleString()}</span>
      </div>
      <div style={{ height: "6px", background: "var(--bg-elevated)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{
          height:     "100%",
          width:      `${width}%`,
          background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
          borderRadius: "3px",
          transition: "width 0.8s ease-out",
        }} />
      </div>
    </div>
  );
}
