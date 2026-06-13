"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import PlayerCard from "./player-card";

interface PlayerCardFlipProps {
  player: {
    displayName: string;
    avatarUrl?: string | null;
    elo: number;
    level: number;
    position?: string | null;
    attrAttack: number;
    attrDefense: number;
    attrVolley: number;
    attrConsistency: number;
    totalWins: number;
    totalLosses: number;
  };
  size?: "sm" | "md" | "lg";
  autoFlip?: boolean;
}

export default function PlayerCardFlip({
  player,
  size = "md",
  autoFlip = true,
}: PlayerCardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showShine, setShowShine] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [8, -8]),
    { stiffness: 300, damping: 30 }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-8, 8]),
    { stiffness: 300, damping: 30 }
  );

  const baseWidth = size === "sm" ? 220 : size === "lg" ? 380 : 300;

  useEffect(() => {
    if (!autoFlip) return;
    const t1 = setTimeout(() => {
      setShowShine(true);
      setIsFlipped(true);
    }, 600);
    const t2 = setTimeout(() => setShowShine(false), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [autoFlip]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  function handleClick() {
    setShowShine(true);
    setIsFlipped((f) => !f);
    setTimeout(() => setShowShine(false), 800);
  }

  return (
    <div
      style={{
        perspective: "1200px",
        perspectiveOrigin: "center center",
        width: baseWidth,
        cursor: "pointer",
      }}
      onClick={handleClick}
      title="Toca para girar la carta"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "relative",
          width: baseWidth,
          height: Math.round(baseWidth * 1.4),
          transformStyle: "preserve-3d",
          rotateX: isFlipped ? 0 : rotateX,
          rotateY: isFlipped ? 180 : rotateY,
        }}
        animate={{
          rotateY: isFlipped ? 180 : 0,
        }}
        transition={{
          duration: 0.7,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* CARA FRONTAL */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <PlayerCard player={player} size={size} />

          {showShine && (
            <motion.div
              initial={{ x: "-100%", opacity: 0.8 }}
              animate={{ x: "200%", opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 10,
                borderRadius: "inherit",
              }}
            />
          )}
        </div>

        {/* CARA TRASERA (dorso) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <CardBack size={size} />
        </div>
      </motion.div>

      {/* Hint de interacción */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "rgba(148,163,184,0.6)",
          marginTop: "10px",
          userSelect: "none",
        }}
      >
        {isFlipped ? "Toca para ver el frente" : "Toca para girar"}
      </motion.p>
    </div>
  );
}

function CardBack({ size }: { size: "sm" | "md" | "lg" }) {
  const baseWidth = size === "sm" ? 220 : size === "lg" ? 380 : 300;
  const baseHeight = Math.round(baseWidth * 1.4);
  const fs = (pct: number) => Math.round(baseWidth * (pct / 100));

  return (
    <div
      style={{
        width: baseWidth,
        height: baseHeight,
        clipPath:
          "polygon(50% 0%, 95% 5%, 100% 15%, 100% 85%, 80% 100%, 20% 100%, 0% 85%, 0% 15%, 5% 5%)",
        background:
          "linear-gradient(160deg, #0d2137 0%, #0a1628 40%, #071020 100%)",
        outline: "2px solid #39ff14",
        outlineOffset: "2px",
        boxShadow:
          "0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(57,255,20,0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: fs(3),
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Arial Black', Impact, sans-serif",
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(57,255,20,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(57,255,20,0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${fs(6)}px ${fs(6)}px`,
          pointerEvents: "none",
        }}
      />

      {/* Patrón de rombos central */}
      <div
        style={{
          position: "absolute",
          inset: "15%",
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(0,212,255,0.04) 0px,
            rgba(0,212,255,0.04) 1px,
            transparent 1px,
            transparent ${fs(5)}px
          )`,
          pointerEvents: "none",
        }}
      />

      {/* Logo grande en el centro */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: fs(2),
          zIndex: 1,
        }}
      >
        {/* Icono de raqueta SVG */}
        <svg
          viewBox="0 0 80 80"
          style={{
            width: fs(25),
            height: fs(25),
            filter: "drop-shadow(0 0 8px rgba(57,255,20,0.6))",
          }}
        >
          <ellipse cx="40" cy="28" rx="22" ry="24" stroke="#39ff14" strokeWidth="3" fill="none" />
          <line x1="20" y1="20" x2="60" y2="20" stroke="#39ff14" strokeWidth="1" opacity="0.5" />
          <line x1="18" y1="28" x2="62" y2="28" stroke="#39ff14" strokeWidth="1" opacity="0.5" />
          <line x1="20" y1="36" x2="60" y2="36" stroke="#39ff14" strokeWidth="1" opacity="0.5" />
          <line x1="30" y1="6" x2="30" y2="50" stroke="#39ff14" strokeWidth="1" opacity="0.5" />
          <line x1="40" y1="4" x2="40" y2="52" stroke="#39ff14" strokeWidth="1" opacity="0.5" />
          <line x1="50" y1="6" x2="50" y2="50" stroke="#39ff14" strokeWidth="1" opacity="0.5" />
          <rect x="36" y="50" width="8" height="22" rx="3" fill="#00d4ff" />
          <rect x="34" y="48" width="12" height="5" rx="2" fill="#39ff14" />
        </svg>

        {/* Texto PadelXP */}
        <div style={{ display: "flex", alignItems: "baseline", gap: fs(0.5) }}>
          <span
            style={{
              color: "#ffffff",
              fontSize: fs(9),
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Padel
          </span>
          <span
            style={{
              color: "#39ff14",
              fontSize: fs(9),
              fontWeight: 900,
              textShadow: "0 0 10px rgba(57,255,20,0.8)",
            }}
          >
            XP
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: "rgba(0,212,255,0.7)",
            fontSize: fs(3),
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 400,
            fontFamily: "Arial, sans-serif",
          }}
        >
          Track · Compete · Level Up
        </div>
      </div>

      {/* Número de serie en la parte inferior */}
      <div
        style={{
          position: "absolute",
          bottom: fs(5),
          color: "rgba(57,255,20,0.3)",
          fontSize: fs(2.5),
          letterSpacing: "0.15em",
          fontFamily: "monospace",
          fontWeight: 400,
        }}
      >
        PADELXP · SEASON IV
      </div>
    </div>
  );
}
