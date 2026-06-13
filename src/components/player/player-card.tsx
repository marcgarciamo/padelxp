"use client";

import { motion } from "motion/react";

interface PlayerCardProps {
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
}

const STAT_ICONS: Record<string, string> = {
  DER: "◀",
  REV: "▶",
  VOL: "▲",
  BAN: "◆",
  REM: "◑",
  GLO: "⊕",
  ATA: "◈",
  DEF: "⬡",
  MEN: "◉",
  FIS: "☽",
};

export default function PlayerCard({ player, size = "md" }: PlayerCardProps) {
  const baseWidth = size === "sm" ? 220 : size === "lg" ? 380 : 300;
  const baseHeight = Math.round(baseWidth * 1.4);
  const fs = (pct: number) => Math.round(baseWidth * (pct / 100));

  const globalRating = Math.round(
    (player.attrAttack +
      player.attrDefense +
      player.attrVolley +
      player.attrConsistency) /
      4
  );

  const positionLabel =
    player.position === "left"
      ? "REVÉS"
      : player.position === "right"
        ? "DERECHA"
        : player.position === "both"
          ? "AMBOS"
          : "—";

  const initials = player.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const STATS_ROW1 = [
    { key: "DER", label: "DER", value: player.attrAttack },
    { key: "REV", label: "REV", value: player.attrDefense },
    { key: "VOL", label: "VOL", value: player.attrVolley },
    { key: "BAN", label: "BAN", value: Math.round(player.attrConsistency * 0.9) },
    { key: "REM", label: "REM", value: Math.round(player.attrAttack * 0.85) },
  ];

  const STATS_ROW2 = [
    { key: "GLO", label: "GLO", value: globalRating },
    { key: "ATA", label: "ATA", value: player.attrAttack },
    { key: "DEF", label: "DEF", value: player.attrDefense },
    {
      key: "MEN",
      label: "MEN",
      value: Math.round(
        (player.attrConsistency + player.attrDefense) / 2
      ),
    },
    {
      key: "FIS",
      label: "FIS",
      value: Math.round((player.attrAttack + player.attrVolley) / 2),
    },
  ];

  const photoZoneHeight = Math.round(baseHeight * 0.42);
  const nameZoneHeight = Math.round(baseHeight * 0.13);
  const statsRow1Height = Math.round(baseHeight * 0.21);
  const statsRow2Height = Math.round(baseHeight * 0.18);
  const footerHeight = Math.round(baseHeight * 0.06);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotateY: -15 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ perspective: 1000 }}
    >
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          position: "relative",
          borderRadius: `${fs(5)}px ${fs(5)}px ${fs(3)}px ${fs(3)}px`,
          clipPath:
            "polygon(50% 0%, 95% 5%, 100% 15%, 100% 85%, 80% 100%, 20% 100%, 0% 85%, 0% 15%, 5% 5%)",
          background: "linear-gradient(160deg, #0d2137 0%, #0a1628 40%, #071020 100%)",
          outline: "2px solid #39ff14",
          outlineOffset: "2px",
          boxShadow:
            "0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(57,255,20,0.2), inset 0 0 30px rgba(0,212,255,0.05)",
          overflow: "hidden",
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          userSelect: "none",
        }}
      >
        {/* Grid lines de fondo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: `${fs(6)}px ${fs(6)}px`,
            pointerEvents: "none",
          }}
        />

        {/* Borde interior cyan */}
        <div
          style={{
            position: "absolute",
            inset: fs(1.5),
            clipPath:
              "polygon(50% 0%, 95% 5%, 100% 15%, 100% 85%, 80% 100%, 20% 100%, 0% 85%, 0% 15%, 5% 5%)",
            border: "1px solid rgba(0,212,255,0.5)",
            pointerEvents: "none",
            boxShadow: "inset 0 0 15px rgba(0,212,255,0.1)",
          }}
        />

        {/* Luz radial detrás de la foto */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "60%",
            height: "45%",
            background:
              "radial-gradient(ellipse at 70% 30%, rgba(57,255,20,0.12) 0%, rgba(0,212,255,0.08) 40%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Zona foto + rating (42%) */}
        <div
          style={{
            height: photoZoneHeight,
            display: "flex",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Columna izquierda: rating + posición (45%) */}
          <div
            style={{
              width: "45%",
              paddingTop: fs(8),
              paddingLeft: fs(6),
              display: "flex",
              flexDirection: "column",
              gap: fs(2),
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                color: "#8ba3bc",
                fontSize: fs(3.5),
                fontWeight: 400,
                letterSpacing: "1px",
                lineHeight: 1,
              }}
            >
              GLOBAL
            </div>
            <div
              style={{
                color: "#39ff14",
                fontSize: fs(13),
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {globalRating}
            </div>
            <div
              style={{
                color: "#8ba3bc",
                fontSize: fs(3),
                fontWeight: 400,
                letterSpacing: "1px",
                lineHeight: 1,
                marginTop: fs(1),
              }}
            >
              POSICIÓN
            </div>
            <div
              style={{
                color: "#ffffff",
                fontSize: fs(5),
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {positionLabel}
            </div>
          </div>

          {/* Columna derecha: foto (55%) */}
          <div
            style={{
              width: "55%",
              height: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.displayName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top center",
                  maskImage:
                    "linear-gradient(to bottom, black 60%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 60%, transparent 100%)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background:
                    "radial-gradient(circle at center, rgba(0,212,255,0.15), transparent)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: fs(2),
                }}
              >
                {/* Círculo con iniciales */}
                <div
                  style={{
                    width: fs(22),
                    height: fs(22),
                    borderRadius: "50%",
                    background: "rgba(0,212,255,0.2)",
                    border: `2px solid #00d4ff`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      color: "#00d4ff",
                      fontSize: fs(9),
                      fontWeight: 700,
                    }}
                  >
                    {initials}
                  </span>
                </div>

                {/* SVG silueta jugador */}
                <svg
                  viewBox="0 0 60 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    width: fs(18),
                    opacity: 0.4,
                    marginTop: fs(1),
                  }}
                >
                  <circle cx="30" cy="10" r="8" fill="#00d4ff" />
                  <path
                    d="M18 28 Q30 22 42 28 L44 55 Q30 60 16 55 Z"
                    fill="#00d4ff"
                  />
                  <path
                    d="M42 30 L54 20"
                    stroke="#00d4ff"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="56"
                    cy="18"
                    r="6"
                    stroke="#39ff14"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M22 55 L18 75 M38 55 L42 75"
                    stroke="#00d4ff"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Zona nombre (13%) */}
        <div
          style={{
            height: nameZoneHeight,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "stretch",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              margin: `0 ${fs(4)}px`,
            }}
          />
          <div
            style={{
              textAlign: "center",
              fontSize: fs(8),
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.05em",
              padding: `${fs(2)}px ${fs(3)}px`,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1,
            }}
          >
            {player.displayName}
          </div>
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              margin: `0 ${fs(4)}px`,
            }}
          />
        </div>

        {/* Zona stats fila 1 (21%) */}
        <div
          style={{
            height: statsRow1Height,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            padding: `${fs(1)}px ${fs(2)}px`,
            position: "relative",
            zIndex: 1,
          }}
        >
          {STATS_ROW1.map((stat) => (
            <div
              key={stat.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: fs(0.5),
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: fs(4.5),
                  lineHeight: 1,
                  color: "#00d4ff",
                }}
              >
                {STAT_ICONS[stat.key]}
              </div>
              <div
                style={{
                  fontSize: fs(2.8),
                  color: "#00d4ff",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  lineHeight: 1,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: fs(6.5),
                  fontWeight: 900,
                  color: "#39ff14",
                  lineHeight: 1,
                }}
              >
                {String(stat.value).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        {/* Zona stats fila 2 (18%) */}
        <div
          style={{
            height: statsRow2Height,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            padding: `${fs(1)}px ${fs(2)}px`,
            position: "relative",
            zIndex: 1,
          }}
        >
          {STATS_ROW2.map((stat) => (
            <div
              key={stat.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: fs(0.5),
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: fs(4.5),
                  lineHeight: 1,
                  color: "#00d4ff",
                }}
              >
                {STAT_ICONS[stat.key]}
              </div>
              <div
                style={{
                  fontSize: fs(2.8),
                  color: "#00d4ff",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  lineHeight: 1,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: fs(6.5),
                  fontWeight: 900,
                  color: "#39ff14",
                  lineHeight: 1,
                }}
              >
                {String(stat.value).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        {/* Footer (6%) */}
        <div
          style={{
            height: footerHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.3)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span style={{ color: "#ffffff", fontSize: fs(4), fontWeight: 700 }}>
            Padel
          </span>
          <span
            style={{ color: "#39ff14", fontSize: fs(4), fontWeight: 900 }}
          >
            XP
          </span>
        </div>
      </div>
    </motion.div>
  );
}
