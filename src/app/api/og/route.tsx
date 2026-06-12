import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import { db } from "@db/index";
import { players } from "@db/schema";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

const size = {
  width: 600,
  height: 900,
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatPosition(position: "left" | "right" | "both" | null) {
  if (position === "left") return "Reves";
  if (position === "right") return "Drive";
  return "Ambos lados";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("id");

    if (!playerId) {
      return new Response("Missing player id", { status: 400 });
    }

    const player = await db.query.players.findFirst({
      where: or(eq(players.id, playerId), eq(players.userId, playerId)),
      with: { achievements: true },
    });

    if (!player) {
      return new Response("Player not found", { status: 404 });
    }

    const totalMatches = player.totalWins + player.totalLosses;
    const winRate = totalMatches > 0 ? Math.round((player.totalWins / totalMatches) * 100) : 0;
    const xpProgress = Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100));
    const initials = getInitials(player.displayName || player.username) || "PX";
    const position = formatPosition(player.position);
    const ovr = player.elo;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background:
              "radial-gradient(circle at top, rgba(255,255,255,0.35), transparent 32%), linear-gradient(180deg, #f7d774 0%, #d6a84f 24%, #8c6a1f 100%)",
            color: "#1f1402",
            fontFamily: "Arial",
            padding: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              border: "2px solid rgba(255,255,255,0.45)",
              borderRadius: 38,
              background: "rgba(255,255,255,0.14)",
              padding: 28,
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 18, color: "rgba(31,20,2,0.75)", letterSpacing: 2, fontWeight: 700 }}>PADELXP</div>
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{position}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ fontSize: 16, color: "rgba(31,20,2,0.75)", fontWeight: 700, letterSpacing: 2 }}>OVR</div>
                <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 0.9 }}>{ovr}</div>
                <div style={{ fontSize: 14, color: "rgba(31,20,2,0.75)", marginTop: 2, fontWeight: 700 }}>LV {player.level}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 26 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 178,
                  height: 178,
                  borderRadius: 89,
                  background: "rgba(255,255,255,0.24)",
                  border: "5px solid rgba(31,20,2,0.2)",
                  color: "#1f1402",
                  fontSize: 66,
                  fontWeight: 900,
                  boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)",
                }}
              >
                {initials}
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, marginTop: 22, textAlign: "center", lineHeight: 1 }}>
                {player.displayName}
              </div>
              <div style={{ fontSize: 22, color: "rgba(31,20,2,0.76)", marginTop: 8, fontWeight: 700 }}>@{player.username}</div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 34 }}>
              <Stat label="ELO" value={player.elo.toString()} />
              <Stat label="Posicion" value={position} />
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
              <Stat label="Victorias" value={player.totalWins.toString()} />
              <Stat label="Win rate" value={`${winRate}%`} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21, color: "#cbd5e1" }}>
                <span>XP</span>
                <span>
                  {player.xp} / {player.xpToNextLevel}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: 20,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                  marginTop: 12,
                  overflow: "hidden",
                }}
              >
                <div style={{ width: `${xpProgress}%`, height: "100%", background: "#1f1402" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 12 }}>
              <Attribute label="Ataque" value={player.attrAttack} color="#8b5cf6" />
              <Attribute label="Defensa" value={player.attrDefense} color="#06b6d4" />
              <Attribute label="Volea" value={player.attrVolley} color="#f97316" />
              <Attribute label="Control" value={player.attrConsistency} color="#16a34a" />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, color: "rgba(31,20,2,0.8)", fontSize: 18, fontWeight: 700 }}>
              <span>{player.achievements.length} logros</span>
              <span>{totalMatches} partidos</span>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e) {
    console.error("OG Error:", e);
    return new Response("Failed to generate player card", { status: 500 });
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(31,20,2,0.14)",
        borderRadius: 22,
        padding: 20,
      }}
    >
      <span style={{ fontSize: 17, color: "rgba(31,20,2,0.75)" }}>{label}</span>
      <span style={{ fontSize: 31, fontWeight: 900, marginTop: 7 }}>{value}</span>
    </div>
  );
}

function Attribute({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ display: "flex", width: 120, fontSize: 18, color: "#cbd5e1" }}>{label}</div>
      <div style={{ display: "flex", flex: 1, height: 14, borderRadius: 7, background: "#1f2937", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", background: color }} />
      </div>
      <div style={{ display: "flex", width: 34, justifyContent: "flex-end", fontSize: 18, color: "#f8fafc" }}>{value}</div>
    </div>
  );
}
