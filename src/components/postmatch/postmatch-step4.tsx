"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import Link from "next/link";

interface Props {
  flow:          any;
  currentPlayer: any;
  rewards:       any;
}

export function PostmatchStep4({ flow, currentPlayer, rewards }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1500),
      setTimeout(() => {
        setStep(4);
        confetti({
          particleCount: 80,
          spread:        60,
          origin:        { y: 0.6 },
          colors:        ["#7c5cfc", "#a78bfa", "#22c55e", "#f59e0b"],
        });
      }, 2100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const items = [
    { icon: "🏆", title: "Partido procesado",             sub: "El resultado ha quedado registrado",                       show: step >= 1 },
    { icon: "⚡", title: "+XP ganados",                    sub: "Tu barra de experiencia ha subido",                        show: step >= 2 },
    { icon: "✨", title: "Puntos de Prestigio aplicados", sub: "Los atributos del partido se han actualizado",              show: step >= 3 },
    { icon: "🌟", title: "¡Todo listo!",                   sub: "Vuelve a la liga para ver la clasificación actualizada",   show: step >= 4 },
  ];

  return (
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        style={{ fontSize: "64px", marginBottom: "16px" }}
      >
        🎉
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}
      >
        ¡Partido Procesado!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}
      >
        Tus stats se han actualizado
      </motion.p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        {items.map((item, i) => (
          item.show && (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="card"
              style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", textAlign: "left" }}
            >
              <span style={{ fontSize: "24px" }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.sub}</div>
              </div>
            </motion.div>
          )
        ))}
      </div>

      {step >= 4 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            href={flow.matchType === "league" ? "/leagues" : flow.matchType === "regular" ? "/matches" : "/tournaments"}
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "8px",
              background:     "var(--accent)",
              color:          "#fff",
              padding:        "14px 28px",
              borderRadius:   "12px",
              fontSize:       "14px",
              fontWeight:     600,
              textDecoration: "none",
            }}
          >
            Ver clasificación actualizada →
          </Link>
        </motion.div>
      )}
    </div>
  );
}
