import { ImageResponse } from "@vercel/og";
import { type NextRequest } from "next/server";
import { db } from "@db/index";
import { players } from "@db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("id");

  if (!playerId) {
    return new Response("Missing id", { status: 400 });
  }

  const player = await db.query.players.findFirst({
    where: eq(players.id, playerId),
  });

  if (!player) {
    return new Response("Player not found", { status: 404 });
  }

  const initials = player.displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const winRate = player.totalWins + player.totalLosses > 0
    ? Math.round((player.totalWins / (player.totalWins + player.totalLosses)) * 100)
    : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width:          "1200px",
          height:         "630px",
          background:     "linear-gradient(135deg, #0d0f14 0%, #161922 50%, #1f242e 100%)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontFamily:     "system-ui, sans-serif",
          padding:        "60px",
          gap:            "60px",
        }}
      >
        {/* Avatar */}
        <div style={{
          width:           160,
          height:          160,
          borderRadius:    "50%",
          background:      "linear-gradient(135deg, #b5ff55, #d2ff96)",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          fontSize:        "56px",
          fontWeight:      700,
          color:           "#000",
          flexShrink:      0,
        }}>
          {initials}
        </div>

        {/* Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#b5ff55" }} />
            <span style={{ fontSize: "20px", color: "#9ba3af" }}>PadelXP</span>
          </div>

          <div style={{ fontSize: "56px", fontWeight: 700, color: "#ffffff", lineHeight: 1.1 }}>
            {player.displayName}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ background: "rgba(181,255,85,0.12)", border: "1px solid rgba(181,255,85,0.3)", borderRadius: "20px", padding: "6px 16px", color: "#b5ff55", fontSize: "18px" }}>
              LV {player.level}
            </div>
            <div style={{ background: "rgba(181,255,85,0.12)", border: "1px solid rgba(181,255,85,0.3)", borderRadius: "20px", padding: "6px 16px", color: "#b5ff55", fontSize: "18px" }}>
              {player.elo} ELO
            </div>
          </div>

          <div style={{ display: "flex", gap: "32px", marginTop: "8px" }}>
            {[
              { val: player.totalWins,  lbl: "Victorias" },
              { val: `${winRate}%`,     lbl: "Win Rate" },
              { val: player.winStreak,  lbl: "Racha" },
            ].map((s) => (
              <div key={s.lbl} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "36px", fontWeight: 700, color: "#ffffff" }}>{s.val}</span>
                <span style={{ fontSize: "16px", color: "#9ba3af" }}>{s.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
