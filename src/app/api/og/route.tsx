import { ImageResponse } from "@vercel/og";
import { type NextRequest } from "next/server";
import { db } from "@db/index";
import { players } from "@db/schema";
import { eq, or } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // PRUEBA DE AISLAMIENTO: Usamos datos fijos para descartar error de DB
    const accentColor = "#b5ff55";

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
          <div style={{ display: "flex", fontSize: "120px", fontWeight: "bold", color: accentColor }}>99</div>
          <div style={{ display: "flex", fontSize: "60px", fontWeight: "bold", marginTop: "20px", textAlign: "center" }}>MODO PRUEBA</div>
          <div style={{ display: "flex", fontSize: "30px", marginTop: "40px", color: "#888" }}>SI VES ESTO, LA DB ES EL PROBLEMA</div>
          <div style={{ display: "flex", fontSize: "20px", marginTop: "60px", letterSpacing: "5px", color: accentColor }}>PADELXP</div>
        </div>
      ),
      { width: 600, height: 900 }
    );
  } catch (e: any) {
    return new Response(`Error Crítico: ${e.message}`, { status: 500 });
  }
}
