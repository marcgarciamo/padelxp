import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "padelxp_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function getAdminSecret() {
  const raw = process.env.ADMIN_JWT_SECRET ?? "";
  const s = (raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw).trim();
  if (!s) throw new Error("ADMIN_JWT_SECRET no configurado");
  return new TextEncoder().encode(s);
}

export async function signAdminToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAdminSecret());
}

export async function getAdminSession(): Promise<{ username: string } | null> {
  try {
    const store = await cookies();
    const token = store.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getAdminSecret());
    return { username: payload.username as string };
  } catch {
    return null;
  }
}

export async function deleteAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}
