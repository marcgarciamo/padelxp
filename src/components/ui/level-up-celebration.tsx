"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface LevelUpCelebrationProps {
  newLevel: number;
  onDone:   () => void;
}

export function LevelUpCelebration({ newLevel, onDone }: LevelUpCelebrationProps) {
  useEffect(() => {
    // Lanzar confetti
    confetti({
      particleCount: 120,
      spread:        80,
      origin:        { y: 0.6 },
      colors:        ["#b5ff55", "#d2ff96", "#22c55e", "#fcd34d", "#fff"],
    });
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      zIndex:     100,
      display:    "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(8px)",
    }}
    onClick={onDone}
    >
      <div style={{ textAlign: "center", animation: "level-up-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ fontSize: "64px", marginBottom: "8px" }}>🎉</div>
        <div style={{ fontSize: "32px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>¡Nivel {newLevel}!</div>
        <div style={{ fontSize: "16px", color: "var(--accent)" }}>Has subido de nivel</div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "24px" }}>Toca para continuar</div>
      </div>
    </div>
  );
}
