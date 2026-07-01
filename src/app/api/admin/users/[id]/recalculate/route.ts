import { type NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@lib/admin-session";
import { db } from "@db/index";
import { players, adminActivityLog } from "@db/schema";
import { eq } from "drizzle-orm";
import { calculateGlobalRating } from "@lib/attributes";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const player = await db.query.players.findFirst({ where: eq(players.id, id) });
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const mediaGlobal = calculateGlobalRating({
    attrAttack:       player.attrAttack,
    attrDefense:      player.attrDefense,
    attrVolley:       player.attrVolley,
    attrConsistency:  player.attrConsistency,
    attrBandeja:      player.attrBandeja,
    attrRemate:       player.attrRemate,
  });

  await db.insert(adminActivityLog).values({
    adminId:    session.username,
    action:     "player_media_recalculated",
    targetType: "player",
    targetId:   id,
    metadata:   { mediaGlobal, displayName: player.displayName },
  });

  return NextResponse.json({ success: true, mediaGlobal });
}
