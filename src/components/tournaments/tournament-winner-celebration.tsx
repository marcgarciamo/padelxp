"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  winnerName: string;
}

export function TournamentWinnerCelebration({ winnerName }: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Lanzar ráfagas de confetti
    const end = Date.now() + 3 * 1000;
    const colors = ["#b5ff55", "#7c5cfc", "#ffffff"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Una explosión central
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    });
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position:   "fixed",
            inset:      0,
            zIndex:     100,
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            padding: "20px",
          }}
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ scale: 0.5, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            style={{ textAlign: "center" }}
          >
            <div style={{ fontSize: "80px", marginBottom: "16px" }}>🏆</div>
            <div style={{ fontSize: "14px", color: "var(--accent-light)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>
              ¡CAMPEONES!
            </div>
            <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#fff", marginBottom: "24px" }}>
              {winnerName}
            </h2>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Toca para cerrar
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
