import { ImageResponse } from "@vercel/og";
import { type NextRequest } from "next/server";
import { db } from "@db/index";
import { players } from "@db/schema";
import { eq, or } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("id");

    if (!playerId) return new Response("Missing id", { status: 400 });

    const player = await db.query.players.findFirst({
      where: or(eq(players.id, playerId), eq(players.userId, playerId)),
    });

    if (!player) return new Response("Player not found", { status: 404 });

    const initials = (player.displayName || "PX")
      .split(" ")
      .filter(Boolean)
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const totalMatches = (player.totalWins || 0) + (player.totalLosses || 0);
    const winRate = totalMatches > 0
      ? Math.round(((player.totalWins || 0) / totalMatches) * 100)
      : 0;

    const lastName = (player.displayName || "Jugador").split(" ").filter(Boolean).pop() || "PX";

    // Colores según el nivel (Bronce, Plata, Oro)
    let cardBg = "linear-gradient(135deg, #1a1c23 0%, #0d0e12 100%)";
    let accentColor = "#b5ff55"; 
    let textColor = "#ffffff";

    if (player.level < 5) {
      cardBg = "linear-gradient(135deg, #4d2b1a 0%, #1a0f0a 100%)";
      accentColor = "#cd7f32";
    } else if (player.level < 15) {
      cardBg = "linear-gradient(135deg, #3d3d3d 0%, #1a1a1a 100%)";
      accentColor = "#c0c0c0";
    } else {
      cardBg = "linear-gradient(135deg, #2c240a 0%, #000000 100%)";
      accentColor = "#ffd700";
    }

    return new ImageResponse(
      (
        <div
          style={{
            width:          "600px",
            height:         "900px",
            background:     "#111",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            fontFamily:     "sans-serif",
            border:         `10px solid ${accentColor}`,
            padding:        "40px",
            color:          "#fff"
          }}
        >
          <div style={{ display: "flex", fontSize: "120px", fontWeight: "bold", color: accentColor }}>{player.level}</div>
          <div style={{ display: "flex", fontSize: "60px", fontWeight: "bold", marginTop: "20px", textAlign: "center" }}>{player.displayName}</div>
          <div style={{ display: "flex", fontSize: "30px", marginTop: "40px", color: "#888" }}>{player.elo} ELO · {winRate}% WR</div>
          <div style={{ display: "flex", fontSize: "20px", marginTop: "60px", letterSpacing: "5px", color: accentColor }}>PADELXP</div>
        </div>
      ),
      { width: 600, height: 900 }
    );
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}
