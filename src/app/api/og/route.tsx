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
    
    // Test de conexión simple
    const testPlayer = await db.query.players.findFirst();

    return new Response(`API OK. Player ID: ${playerId}. DB Test: ${testPlayer ? 'Conectada' : 'Sin datos'}. Generando imagen...`, { status: 200 });
    
    /* 
    // Comentamos el generador para ver si el fallo ocurre antes
    return new ImageResponse(
      (
        <div style={{ width: "600px", height: "900px", background: "#111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          TEST
        </div>
      ),
      { width: 600, height: 900 }
    );
    */
  } catch (e: any) {
    console.error("OG Error:", e);
    return new Response(`ERROR TECNICO: ${e.message} \nStack: ${e.stack}`, { status: 200 }); // Devolvemos 200 para que el navegador muestre el texto
  }
}
