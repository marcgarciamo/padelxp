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

  const totalMatches = player.totalWins + player.totalLosses;
  const winRate = totalMatches > 0
    ? Math.round((player.totalWins / totalMatches) * 100)
    : 0;

  // Colores según el nivel (Bronce, Plata, Oro)
  let cardBg = "linear-gradient(135deg, #1a1c23 0%, #0d0e12 100%)";
  let accentColor = "#b5ff55"; // Verde PadelXP por defecto (Oro)
  let textColor = "#ffffff";

  if (player.level < 5) {
    cardBg = "linear-gradient(135deg, #4d2b1a 0%, #1a0f0a 100%)"; // Bronce
    accentColor = "#cd7f32";
  } else if (player.level < 15) {
    cardBg = "linear-gradient(135deg, #3d3d3d 0%, #1a1a1a 100%)"; // Plata
    accentColor = "#c0c0c0";
  } else {
    cardBg = "linear-gradient(135deg, #2c240a 0%, #000000 100%)"; // Oro/Especial
    accentColor = "#ffd700";
  }

  return new ImageResponse(
    (
      <div
        style={{
          width:          "600px",
          height:         "900px",
          background:     cardBg,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          fontFamily:     "system-ui, sans-serif",
          position:       "relative",
          border:         `4px solid ${accentColor}`,
          borderRadius:   "40px 40px 20px 20px",
          overflow:       "hidden",
        }}
      >
        {/* Adorno de fondo */}
        <div style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: accentColor,
          opacity: 0.05,
        }} />

        {/* Top Section: Rating & Position */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "absolute",
          left: "40px",
          top: "60px",
          gap: "2px"
        }}>
          <span style={{ fontSize: "84px", fontWeight: 800, color: accentColor, lineHeight: 1 }}>{player.level}</span>
          <span style={{ fontSize: "28px", fontWeight: 600, color: textColor, opacity: 0.8 }}>{player.position === 'both' ? 'ALL' : player.position === 'left' ? 'REV' : 'DRCH'}</span>
          <div style={{ width: "40px", height: "3px", background: accentColor, marginTop: "10px" }} />
          <div style={{ fontSize: "20px", marginTop: "10px", color: textColor, opacity: 0.5 }}>XP</div>
        </div>

        {/* Player Image / Avatar */}
        <div style={{
          width: "320px",
          height: "320px",
          marginTop: "100px",
          marginLeft: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          {player.avatarUrl ? (
            <img 
              src={player.avatarUrl} 
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", border: `4px solid ${accentColor}` }} 
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${accentColor}44, ${accentColor}88)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "100px",
              fontWeight: 800,
              color: "#fff",
              border: `4px solid ${accentColor}`
            }}>
              {initials}
            </div>
          )}
        </div>

        {/* Name Banner */}
        <div style={{
          marginTop: "40px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <div style={{ 
            fontSize: "48px", 
            fontWeight: 800, 
            color: "#fff", 
            textTransform: "uppercase",
            letterSpacing: "1px",
            textAlign: "center",
            padding: "0 40px"
          }}>
            {player.displayName.split(" ").pop()}
          </div>
          <div style={{ width: "80%", height: "2px", background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, marginTop: "10px" }} />
        </div>

        {/* Stats Grid */}
        <div style={{
          marginTop: "40px",
          display: "flex",
          gap: "40px",
          padding: "0 60px",
        }}>
          {/* Column 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { val: player.attrAttack, lbl: "ATQ" },
              { val: player.attrDefense, lbl: "DEF" },
              { val: player.attrVolley, lbl: "VOL" },
            ].map(s => (
              <div key={s.lbl} style={{ display: "flex", alignItems: "center", gap: "12px", width: "160px" }}>
                <span style={{ fontSize: "32px", fontWeight: 800, color: "#fff", width: "50px" }}>{s.val}</span>
                <span style={{ fontSize: "24px", color: textColor, opacity: 0.6, fontWeight: 500 }}>{s.lbl}</span>
              </div>
            ))}
          </div>

          {/* Vertical Divider */}
          <div style={{ width: "2px", background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />

          {/* Column 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { val: player.attrConsistency, lbl: "CON" },
              { val: Math.floor(player.elo / 10), lbl: "ELO" },
              { val: winRate, lbl: "WR%" },
            ].map(s => (
              <div key={s.lbl} style={{ display: "flex", alignItems: "center", gap: "12px", width: "160px" }}>
                <span style={{ fontSize: "32px", fontWeight: 800, color: "#fff", width: "50px" }}>{s.val}</span>
                <span style={{ fontSize: "24px", color: textColor, opacity: 0.6, fontWeight: 500 }}>{s.lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: PadelXP Logo area */}
        <div style={{
          position: "absolute",
          bottom: "40px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          opacity: 0.4
        }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: accentColor }} />
          <span style={{ fontSize: "18px", fontWeight: 600, color: "#fff", letterSpacing: "2px" }}>PADELXP</span>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: accentColor }} />
        </div>
      </div>
    ),
    { width: 600, height: 900 }
  );
}
