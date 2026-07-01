import { type NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@lib/admin-session";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env["RECALCULATE_SECRET"];
  if (!secret) return NextResponse.json({ error: "RECALCULATE_SECRET not configured" }, { status: 500 });

  const { origin } = new URL(request.url);
  const res = await fetch(`${origin}/api/recalculate?secret=${encodeURIComponent(secret)}`);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return NextResponse.json({ error: body || "Recalculate failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
