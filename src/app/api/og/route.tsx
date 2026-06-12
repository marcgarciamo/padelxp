import { ImageResponse } from "@vercel/og";
import { type NextRequest } from "next/server";
import { db } from "@db/index";
import { players } from "@db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDTH = 800;
const HEIGHT = 1120;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatPosition(position: string | null | undefined): string {
  if (position === "left") return "REVÉS";
  if (position === "right") return "DERECHA";
  if (position === "both") return "AMBOS";
  return "JUGADOR";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("id");

    if (!playerId) {
      return new ImageResponse(
        <div style={{ fontSize: 48, color: "white", padding: 20 }}>Missing player id</div>,
        { width: WIDTH, height: HEIGHT }
      );
    }

    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
    });

    if (!player) {
      return new ImageResponse(
        <div style={{ fontSize: 48, color: "white", padding: 20 }}>Player not found</div>,
        { width: WIDTH, height: HEIGHT }
      );
    }

    const globalRating = Math.round(
      (player.attrAttack + player.attrDefense + player.attrVolley + player.attrConsistency) / 4
    );

    const technicalStats = [
      { label: "DER", value: Math.round(player.attrAttack) },
      { label: "REV", value: Math.round(player.attrDefense) },
      { label: "VOL", value: Math.round(player.attrVolley) },
      { label: "BAN", value: Math.round(player.attrConsistency * 0.9) },
      { label: "REM", value: Math.round(player.attrAttack * 0.85) },
    ];

    const generalStats = [
      { label: "GLO", value: globalRating },
      { label: "ATA", value: Math.round(player.attrAttack) },
      { label: "DEF", value: Math.round(player.attrDefense) },
      { label: "MEN", value: Math.round((player.attrConsistency + player.attrDefense) / 2) },
      { label: "FIS", value: Math.round((player.attrAttack + player.attrVolley) / 2) },
    ];

    const position = formatPosition(player.position);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0a1628 0%, #0d2137 100%)",
            fontFamily: "system-ui, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Grid background */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                "linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          {/* Radial light effect */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(ellipse 400px 300px at 70% 20%, rgba(57, 255, 20, 0.15) 0%, transparent 50%)",
            }}
          />

          {/* Card */}
          <div
            style={{
              width: WIDTH - 40,
              height: HEIGHT - 40,
              position: "relative",
              zIndex: 10,
              borderRadius: "32px",
              border: "4px solid #39ff14",
              background: "linear-gradient(135deg, #0a1628 0%, #0d2137 100%)",
              padding: 40,
              display: "flex",
              flexDirection: "column",
              boxShadow:
                "0 0 40px rgba(57, 255, 20, 0.4), 0 0 80px rgba(57, 255, 20, 0.2), 0 0 60px rgba(0, 212, 255, 0.2)",
            }}
          >
            {/* Top section: Rating + Position + Photo */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 20 }}>
              {/* Left: Rating + Position */}
              <div>
                <div style={{ fontSize: 20, color: "#8ba3bc", fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>
                  GLOBAL
                </div>
                <div
                  style={{
                    fontSize: 96,
                    fontWeight: 900,
                    color: "#39ff14",
                    textShadow: "0 0 20px rgba(57, 255, 20, 0.8)",
                    lineHeight: 0.9,
                    marginBottom: 12,
                  }}
                >
                  {globalRating}
                </div>
                <div style={{ fontSize: 16, color: "#8ba3bc", fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
                  POSICIÓN
                </div>
                <div style={{ fontSize: 20, color: "#ffffff", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  {position}
                </div>
              </div>

              {/* Right: Player Photo */}
              {player.avatarUrl && (
                <div
                  style={{
                    width: 140,
                    height: 200,
                    borderRadius: 12,
                    border: "4px solid #39ff14",
                    overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: "0 0 20px rgba(57, 255, 20, 0.4)",
                    backgroundImage: `url('${player.avatarUrl}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}
            </div>

            {/* Divider */}
            <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", margin: "16px 0" }} />

            {/* Player Name */}
            <div
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: "#ffffff",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: 3,
                margin: "16px 0",
                lineHeight: 1.2,
              }}
            >
              {player.displayName}
            </div>

            {/* Divider */}
            <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", margin: "16px 0" }} />

            {/* Technical Stats */}
            <div style={{ display: "flex", justifyContent: "space-around", gap: 8, marginBottom: 16 }}>
              {technicalStats.map((stat) => (
                <div key={stat.label} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>🎾</div>
                  <div style={{ fontSize: 16, color: "#8ba3bc", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: "#00e5ff",
                      textShadow: "0 0 12px rgba(0, 229, 255, 0.6)",
                    }}
                  >
                    {String(stat.value).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent)", margin: "12px 0" }} />

            {/* General Stats */}
            <div style={{ display: "flex", justifyContent: "space-around", gap: 8, marginBottom: 16 }}>
              {generalStats.map((stat) => (
                <div key={stat.label} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>⚡</div>
                  <div style={{ fontSize: 16, color: "#8ba3bc", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: "#00e5ff",
                      textShadow: "0 0 12px rgba(0, 229, 255, 0.6)",
                    }}
                  >
                    {String(stat.value).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)", margin: "12px 0", marginTop: "auto" }} />

            {/* Footer: Logo */}
            <div style={{ textAlign: "center", paddingTop: 12 }}>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: 1,
                }}
              >
                Padel<span style={{ color: "#39ff14" }}>XP</span>
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (e) {
    console.error("OG Error:", e);
    return new ImageResponse(
      <div style={{ fontSize: 48, color: "white" }}>Failed to generate card</div>,
      { width: WIDTH, height: HEIGHT }
    );
  }
}
