import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "padelxp_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function secret() {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s) throw new Error("ADMIN_JWT_SECRET no configurado");
  return new TextEncoder().encode(s);
}

export async function createAdminSession(username: string) {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getAdminSession(): Promise<{ username: string } | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    return { username: payload.username as string };
  } catch {
    return null;
  }
}

export async function deleteAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
