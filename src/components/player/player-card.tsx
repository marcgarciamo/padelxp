"use client";

import React from "react";

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

const StatIcon = ({ type }: { type: string }) => {
  const size = 24;
  const iconMap: Record<string, JSX.Element> = {
    der: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M 8 12 L 16 8 L 16 16 Z" fill="#00e5ff" />
      </svg>
    ),
    rev: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M 16 12 L 8 8 L 8 16 Z" fill="#00e5ff" />
      </svg>
    ),
    vol: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
        <path d="M 12 4 L 18 10 L 12 12 L 6 10 Z" fill="#00e5ff" />
        <circle cx="12" cy="14" r="2" fill="#00e5ff" />
      </svg>
    ),
    ban: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
        <path d="M 12 3 L 16 8 L 16 18 C 16 20 14 22 12 22 C 10 22 8 20 8 18 L 8 8 Z" fill="#00e5ff" />
      </svg>
    ),
    rem: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <path d="M 12 4 L 14 12 L 12 20 L 10 12 Z" fill="#00e5ff" />
      </svg>
    ),
    glo: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M 3 12 H 21 M 12 3 Q 15 8 15 12 Q 15 16 12 21" stroke="#00e5ff" />
      </svg>
    ),
    atq: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
        <path d="M 12 4 L 16 12 L 12 20 L 8 12 Z" fill="#00e5ff" />
        <path d="M 12 8 L 14 12 L 12 16 L 10 12 Z" fill="none" stroke="#00e5ff" strokeWidth="1" />
      </svg>
    ),
    def: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
        <path d="M 12 2 L 20 6 L 20 14 C 20 19 12 22 12 22 C 12 22 4 19 4 14 L 4 6 Z" fill="#00e5ff" />
      </svg>
    ),
    men: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
        <circle cx="12" cy="8" r="4" fill="#00e5ff" />
        <path d="M 8 14 Q 8 12 12 12 Q 16 12 16 14 L 16 20 Q 16 22 12 22 Q 8 22 8 20 Z" fill="#00e5ff" />
      </svg>
    ),
    fis: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
        <circle cx="12" cy="6" r="3" fill="#00e5ff" />
        <path d="M 10 10 L 8 16 M 14 10 L 16 16 M 12 10 L 12 18" stroke="#00e5ff" strokeWidth="2" />
      </svg>
    ),
  };
  return iconMap[type] || null;
};

export default function PlayerCard({ player, size = "md" }: PlayerCardProps) {
  const sizeConfig = {
    sm: { width: 240, ratio: 1.4 },
    md: { width: 320, ratio: 1.4 },
    lg: { width: 400, ratio: 1.4 },
  };

  const config = sizeConfig[size];
  const height = Math.round(config.width * config.ratio);

  const globalRating = Math.round((player.attrAttack + player.attrDefense + player.attrVolley + player.attrConsistency) / 4);

  const positionMap: Record<string, string> = {
    left: "REVÉS",
    right: "DERECHA",
    both: "AMBOS",
  };

  const positionText = player.position ? positionMap[player.position] || player.position.toUpperCase() : "JUGADOR";

  const technicalStats = [
    { label: "DER", value: Math.round(player.attrAttack), icon: "der" },
    { label: "REV", value: Math.round(player.attrDefense), icon: "rev" },
    { label: "VOL", value: Math.round(player.attrVolley), icon: "vol" },
    { label: "BAN", value: Math.round(player.attrConsistency * 0.9), icon: "ban" },
    { label: "REM", value: Math.round(player.attrAttack * 0.85), icon: "rem" },
  ];

  const generalStats = [
    { label: "GLO", value: globalRating, icon: "glo" },
    { label: "ATA", value: Math.round(player.attrAttack), icon: "atq" },
    { label: "DEF", value: Math.round(player.attrDefense), icon: "def" },
    { label: "MEN", value: Math.round((player.attrConsistency + player.attrDefense) / 2), icon: "men" },
    { label: "FIS", value: Math.round((player.attrAttack + player.attrVolley) / 2), icon: "fis" },
  ];

  const containerStyle: React.CSSProperties = {
    width: `${config.width}px`,
    height: `${height}px`,
    position: "relative",
    fontFamily: "system-ui, -apple-system, sans-serif",
    clipPath: "polygon(50% 0%, 100% 8%, 100% 75%, 50% 100%, 0% 75%, 0% 8%)",
    overflow: "hidden",
  };

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  };

  const borderWidth = config.width * 0.015;

  return (
    <div style={containerStyle}>
      {/* Double Border (outer green, inner cyan) */}
      <div
        style={{
          ...baseStyle,
          background: `
            linear-gradient(135deg, #0a1628 0%, #0d2137 100%),
            linear-gradient(90deg, #39ff14, #00d4ff, #39ff14)
          `,
          backgroundOrigin: "padding-box, border-box",
          backgroundClip: "padding-box, border-box",
          border: `${borderWidth}px solid transparent`,
          boxShadow: `
            inset 0 0 ${config.width * 0.08}px rgba(57, 255, 20, 0.3),
            0 0 ${config.width * 0.1}px rgba(57, 255, 20, 0.5),
            0 0 ${config.width * 0.15}px rgba(0, 212, 255, 0.3)
          `,
        }}
      />

      {/* Grid background */}
      <div
        style={{
          ...baseStyle,
          backgroundImage: `
            linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: `${config.width * 0.1}px ${config.width * 0.1}px`,
        }}
      />

      {/* Radial light effect behind photo */}
      <div
        style={{
          ...baseStyle,
          background: `radial-gradient(ellipse 150% 100% at 70% 20%, rgba(57, 255, 20, 0.15) 0%, transparent 50%)`,
          pointerEvents: "none",
        }}
      />

      {/* Content container */}
      <div
        style={{
          ...baseStyle,
          padding: `${config.width * 0.05}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          zIndex: 1,
        }}
      >
        {/* Top section: Rating + Position + Photo */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: `${config.width * 0.03}px`,
            marginBottom: `${config.width * 0.02}px`,
          }}
        >
          {/* Left: Rating + Position */}
          <div style={{ flex: "0 0 auto" }}>
            <div
              style={{
                fontSize: `${config.width * 0.08}px`,
                color: "#8ba3bc",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                lineHeight: "1",
              }}
            >
              GLOBAL
            </div>
            <div
              style={{
                fontSize: `${config.width * 0.24}px`,
                fontWeight: "900",
                color: "#39ff14",
                textShadow: "0 0 10px rgba(57, 255, 20, 0.8)",
                lineHeight: "0.9",
                marginBottom: `${config.width * 0.02}px`,
              }}
            >
              {globalRating}
            </div>
            <div
              style={{
                fontSize: `${config.width * 0.065}px`,
                color: "#8ba3bc",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                lineHeight: "1",
                marginBottom: "2px",
              }}
            >
              POSICIÓN
            </div>
            <div
              style={{
                fontSize: `${config.width * 0.075}px`,
                color: "#ffffff",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                lineHeight: "1",
              }}
            >
              {positionText}
            </div>
          </div>

          {/* Right: Player Photo */}
          {player.avatarUrl && (
            <div
              style={{
                width: `${config.width * 0.35}px`,
                height: `${config.width * 0.5}px`,
                borderRadius: `${config.width * 0.02}px`,
                border: `${borderWidth * 1.5}px solid #39ff14`,
                overflow: "hidden",
                boxShadow: `0 0 ${config.width * 0.06}px rgba(57, 255, 20, 0.4)`,
                flexShrink: 0,
              }}
            >
              <img
                src={player.avatarUrl}
                alt={player.displayName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
            margin: `${config.width * 0.02}px 0`,
          }}
        />

        {/* Player Name */}
        <div
          style={{
            fontSize: `${config.width * 0.11}px`,
            fontWeight: "900",
            color: "#ffffff",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "1px",
            margin: `${config.width * 0.02}px 0`,
            lineHeight: "1.2",
          }}
        >
          {player.displayName}
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
            margin: `${config.width * 0.02}px 0`,
          }}
        />

        {/* Technical Stats Row 1 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            gap: `${config.width * 0.01}px`,
            marginBottom: `${config.width * 0.02}px`,
          }}
        >
          {technicalStats.map((stat) => (
            <div key={stat.label} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  height: `${config.width * 0.08}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "2px",
                }}
              >
                <StatIcon type={stat.icon} />
              </div>
              <div
                style={{
                  fontSize: `${config.width * 0.055}px`,
                  color: "#8ba3bc",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  lineHeight: "1",
                  marginBottom: "1px",
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: `${config.width * 0.075}px`,
                  fontWeight: "900",
                  color: "#00e5ff",
                  textShadow: "0 0 6px rgba(0, 229, 255, 0.6)",
                  lineHeight: "1",
                }}
              >
                {String(stat.value).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent)",
            margin: `${config.width * 0.015}px 0`,
          }}
        />

        {/* General Stats Row 2 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            gap: `${config.width * 0.01}px`,
            marginBottom: `${config.width * 0.02}px`,
          }}
        >
          {generalStats.map((stat) => (
            <div key={stat.label} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  height: `${config.width * 0.08}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "2px",
                }}
              >
                <StatIcon type={stat.icon} />
              </div>
              <div
                style={{
                  fontSize: `${config.width * 0.055}px`,
                  color: "#8ba3bc",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  lineHeight: "1",
                  marginBottom: "1px",
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: `${config.width * 0.075}px`,
                  fontWeight: "900",
                  color: "#00e5ff",
                  textShadow: "0 0 6px rgba(0, 229, 255, 0.6)",
                  lineHeight: "1",
                }}
              >
                {String(stat.value).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Logo */}
        <div
          style={{
            textAlign: "center",
            paddingTop: `${config.width * 0.015}px`,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span
            style={{
              fontSize: `${config.width * 0.065}px`,
              fontWeight: "700",
              color: "#ffffff",
              letterSpacing: "0.5px",
            }}
          >
            Padel
            <span style={{ color: "#39ff14" }}>XP</span>
          </span>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes cardReveal {
          from {
            transform: scale(0.8) rotateY(-15deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotateY(0deg);
            opacity: 1;
          }
        }
        [data-card-animated] {
          animation: cardReveal 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
