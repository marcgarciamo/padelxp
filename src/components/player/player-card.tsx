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
      ? "REV"
      : player.position === "right"
        ? "DER"
        : player.position === "both"
          ? "AMB"
          : "—";

  const initials = player.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const STATS_LEFT = [
    { label: "ATA", value: player.attrAttack,                                          icon: "/icons/attrs/ataque.jpeg" },
    { label: "VOL", value: player.attrVolley,                                          icon: "/icons/attrs/volea.jpeg" },
    { label: "REM", value: Math.round(player.attrAttack * 0.85),                       icon: "/icons/attrs/remate.jpeg" },
  ];

  const STATS_RIGHT = [
    { label: "DEF", value: player.attrDefense,                                         icon: "/icons/attrs/defensa.jpeg" },
    { label: "MEN", value: Math.round((player.attrConsistency + player.attrDefense) / 2), icon: "/icons/attrs/mentalidad.jpeg" },
    { label: "FIS", value: Math.round((player.attrAttack + player.attrVolley) / 2),    icon: "/icons/attrs/fisico.jpeg" },
  ];

  const photoZoneHeight = Math.round(baseHeight * 0.50);
  const nameZoneHeight = Math.round(baseHeight * 0.11);
  const infoZoneHeight = Math.round(baseHeight * 0.09);
  const statsZoneHeight = Math.round(baseHeight * 0.24);
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

        {/* Zona foto (55%) — ocupa todo el ancho */}
        <div
          style={{
            height: photoZoneHeight,
            position: "relative",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          {/* Foto o placeholder */}
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.displayName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
                maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "radial-gradient(ellipse at 50% 30%, rgba(0,212,255,0.15) 0%, transparent 70%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: fs(28),
                  height: fs(28),
                  borderRadius: "50%",
                  background: "rgba(0,212,255,0.15)",
                  border: `2px solid rgba(0,212,255,0.5)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#00d4ff", fontSize: fs(11), fontWeight: 700 }}>
                  {initials}
                </span>
              </div>
            </div>
          )}

          {/* Posición superpuesta — esquina superior izquierda */}
          <div
            style={{
              position: "absolute",
              top: fs(7),
              left: fs(6),
              lineHeight: 1,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: fs(3.5),
                fontWeight: 700,
                letterSpacing: "0.05em",
                lineHeight: 1,
              }}
            >
              {positionLabel}
            </div>
          </div>
        </div>

        {/* Zona nombre (11%) */}
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
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
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
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              margin: `0 ${fs(4)}px`,
            }}
          />
        </div>

        {/* Zona Media + Nivel (9%) */}
        <div
          style={{
            height: infoZoneHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: fs(5),
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: fs(0.5) }}>
            <span style={{ color: "rgba(0,212,255,0.6)", fontSize: fs(2.5), fontWeight: 600, letterSpacing: "0.1em" }}>MEDIA</span>
            <span style={{ color: "#ffffff", fontSize: fs(4.5), fontWeight: 900, lineHeight: 1 }}>{globalRating}</span>
          </div>
          <div style={{ width: 1, height: "50%", background: "rgba(0,212,255,0.3)" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: fs(0.5) }}>
            <span style={{ color: "rgba(0,212,255,0.6)", fontSize: fs(2.5), fontWeight: 600, letterSpacing: "0.1em" }}>NIVEL</span>
            <span style={{ color: "#ffffff", fontSize: fs(4.5), fontWeight: 900, lineHeight: 1 }}>{player.level}</span>
          </div>
        </div>

        {/* Zona stats — 2 columnas de 3 centradas (24%) */}
        <div
          style={{
            height: statsZoneHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: fs(4),
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Columna izquierda */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: fs(1.5) }}>
            {STATS_LEFT.map((stat) => (
              <StatRow key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} fs={fs} />
            ))}
          </div>

          {/* Divisor vertical */}
          <div
            style={{
              width: 1,
              height: "80%",
              background: "linear-gradient(to bottom, transparent, rgba(0,212,255,0.4), transparent)",
            }}
          />

          {/* Columna derecha */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: fs(1.5) }}>
            {STATS_RIGHT.map((stat) => (
              <StatRow key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} fs={fs} />
            ))}
          </div>
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
          <span style={{ color: "#ffffff", fontSize: fs(4), fontWeight: 700 }}>Padel</span>
          <span style={{ color: "#39ff14", fontSize: fs(4), fontWeight: 900 }}>XP</span>
        </div>
      </div>
    </motion.div>
  );
}

function StatRow({
  label,
  value,
  icon,
  fs,
}: {
  label: string;
  value: number;
  icon?: string;
  fs: (pct: number) => number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: fs(2),
        width: fs(22),
      }}
    >
      <span
        style={{
          color: "#39ff14",
          fontSize: fs(5.5),
          fontWeight: 900,
          lineHeight: 1,
          minWidth: fs(7),
          textAlign: "right",
        }}
      >
        {String(value).padStart(2, "0")}
      </span>
      {icon ? (
        <img
          src={icon}
          alt={label}
          style={{
            width: fs(7),
            height: fs(7),
            objectFit: "cover",
            borderRadius: fs(1),
          }}
        />
      ) : (
        <span
          style={{
            color: "rgba(0,212,255,0.8)",
            fontSize: fs(3),
            fontWeight: 600,
            letterSpacing: "0.08em",
            lineHeight: 1,
            minWidth: fs(7),
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
