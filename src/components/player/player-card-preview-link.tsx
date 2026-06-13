"use client";

import Link from "next/link";
import PlayerCard from "./player-card";

interface PlayerCardPreviewLinkProps {
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
}

export default function PlayerCardPreviewLink({
  player,
}: PlayerCardPreviewLinkProps) {
  return (
    <Link href="/profile/card" style={{ textDecoration: "none", display: "block", marginTop: "14px" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "14px",
          background: "linear-gradient(135deg, rgba(13,33,55,0.9), rgba(10,22,40,0.95))",
          border: "1px solid rgba(57,255,20,0.2)",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          cursor: "pointer",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(57,255,20,0.5)";
          e.currentTarget.style.boxShadow = "0 0 20px rgba(57,255,20,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(57,255,20,0.2)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Mini preview de la carta */}
        <div
          style={{
            flexShrink: 0,
            transform: "rotate(-5deg)",
            filter: "drop-shadow(0 4px 12px rgba(57,255,20,0.3))",
          }}
        >
          <PlayerCard player={player} size="sm" />
        </div>

        {/* Texto */}
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "4px",
            }}
          >
            🎴 Ver mi Player Card
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "rgba(0,212,255,0.7)",
            }}
          >
            Comparte tu carta con el crew
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(148,163,184,0.5)",
              marginTop: "6px",
            }}
          >
            Toca para ver el efecto flip →
          </div>
        </div>
      </div>
    </Link>
  );
}
