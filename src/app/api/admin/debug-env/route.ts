import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSession, ADMIN_COOKIE_NAME, getAdminSecret } from "@lib/admin-session";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;

  let verifyResult: unknown = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getAdminSecret());
      verifyResult = { ok: true, payload };
    } catch (e) {
      verifyResult = { ok: false, error: String(e) };
    }
  }

  const session = await getAdminSession();

  return NextResponse.json({
    cookiePresent: !!token,
    tokenLength: token?.length ?? 0,
    verifyResult,
    session,
  });
}
