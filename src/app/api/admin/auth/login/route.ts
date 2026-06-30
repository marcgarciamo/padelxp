import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminSession } from "@lib/admin-session";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Still do a dummy compare to avoid timing leak on length
    timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(a, "utf8"));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username: string = (body.username ?? "").trim();
  const password: string = (body.password ?? "").trim();

  const stripBOM = (s: string) => s.startsWith("﻿") ? s.slice(1) : s;
  const expectedUser = stripBOM((process.env.ADMIN_USERNAME ?? "").trim());
  const expectedPass = stripBOM((process.env.ADMIN_PASSWORD ?? "").trim());

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
