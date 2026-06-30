import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminSession } from "@lib/admin-session";

function safeCompare(a: string, b: string): boolean {
  const buf = Buffer.alloc(512);
  const bufA = Buffer.alloc(512);
  const bufB = Buffer.alloc(512);
  bufA.write(a);
  bufB.write(b);
  // Always compare full buffers to prevent timing attacks, then also check length
  return timingSafeEqual(bufA, bufB) && a.length === b.length;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username: string = body.username ?? "";
  const password: string = body.password ?? "";

  const expectedUser = process.env.ADMIN_USERNAME ?? "";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "";

  if (!expectedUser || !expectedPass) {
    return NextResponse.json({ error: "Admin no configurado" }, { status: 500 });
  }

  const valid = safeCompare(username, expectedUser) && safeCompare(password, expectedPass);

  if (!valid) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  await createAdminSession(username);
  return NextResponse.json({ ok: true });
}
