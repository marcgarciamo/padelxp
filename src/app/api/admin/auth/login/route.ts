import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@lib/admin-session";

const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
const clean = (s: string) => stripBOM(s.trim());

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username: string = clean(String(body.username ?? ""));
  const password: string = clean(String(body.password ?? ""));

  const expectedUser = clean(process.env.ADMIN_USERNAME ?? "");
  const expectedPass = clean(process.env.ADMIN_PASSWORD ?? "");

  if (!expectedUser || !expectedPass) {
    return NextResponse.json({ error: "Admin no configurado" }, { status: 500 });
  }

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({
      error: "Credenciales incorrectas",
      _debug: {
        userLen: username.length, expectedUserLen: expectedUser.length,
        passLen: password.length, expectedPassLen: expectedPass.length,
      }
    }, { status: 401 });
  }

  await createAdminSession(username);
  return NextResponse.json({ ok: true });
}
