import { ImageResponse } from "@vercel/og";
import { type NextRequest } from "next/server";
import { db } from "@db/index";
import { players } from "@db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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

    const accentColor = "#b5ff55";

    return new ImageResponse(
      (
        <div
          style={{
            width:          "600px",
            height:         "900px",
            background:     "#0d0f14",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            fontFamily:     "sans-serif",
            border:         `4px solid ${accentColor}`,
            color:          "#fff",
          }}
        >
          <div style={{ fontSize: "80px", fontWeight: "bold", color: accentColor }}>{player.level}</div>
          <div style={{ fontSize: "60px", marginTop: "20px" }}>{player.displayName}</div>
          <div style={{ fontSize: "30px", marginTop: "40px", opacity: 0.7 }}>{player.elo} ELO · {winRate}% WR</div>
          <div style={{ fontSize: "20px", marginTop: "60px", letterSpacing: "4px" }}>PADELXP</div>
        </div>
      ),
      { width: 600, height: 900 }
    );
  } catch (error: any) {
    console.error("OG Error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
