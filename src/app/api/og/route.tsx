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

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#0b0f14",
            color: "#f8fafc",
            fontFamily: "Arial",
            padding: 34,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              border: "2px solid #2dd4bf",
              borderRadius: 38,
              background: "#111827",
              padding: 34,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 22, color: "#94a3b8", letterSpacing: 2 }}>PADELXP</div>
                <div style={{ fontSize: 18, color: "#2dd4bf", marginTop: 6 }}>PLAYER CARD</div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 86,
                  height: 86,
                  borderRadius: 43,
                  background: "#2dd4bf",
                  color: "#071316",
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                LV {player.level}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 52 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 190,
                  height: 190,
                  borderRadius: 95,
                  background: "#172554",
                  border: "6px solid #2dd4bf",
                  color: "#f8fafc",
                  fontSize: 68,
                  fontWeight: 800,
                }}
              >
                {initials}
              </div>
              <div style={{ fontSize: 54, fontWeight: 800, marginTop: 30, textAlign: "center" }}>
                {player.displayName}
              </div>
              <div style={{ fontSize: 24, color: "#94a3b8", marginTop: 8 }}>@{player.username}</div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 44 }}>
              <Stat label="ELO" value={player.elo.toString()} />
              <Stat label="Posicion" value={formatPosition(player.position)} />
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
                  borderRadius: 10,
                  background: "#1f2937",
                  marginTop: 12,
                  overflow: "hidden",
                }}
              >
                <div style={{ width: `${xpProgress}%`, height: "100%", background: "#2dd4bf" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 12 }}>
              <Attribute label="Ataque" value={player.attrAttack} color="#f97316" />
              <Attribute label="Defensa" value={player.attrDefense} color="#38bdf8" />
              <Attribute label="Volea" value={player.attrVolley} color="#a78bfa" />
              <Attribute label="Consistencia" value={player.attrConsistency} color="#22c55e" />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, color: "#94a3b8", fontSize: 18 }}>
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
        background: "#0f172a",
        border: "1px solid #334155",
        borderRadius: 22,
        padding: 20,
      }}
    >
      <span style={{ fontSize: 17, color: "#94a3b8" }}>{label}</span>
      <span style={{ fontSize: 31, fontWeight: 800, marginTop: 7 }}>{value}</span>
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
