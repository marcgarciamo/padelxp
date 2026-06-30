import { NextResponse } from "next/server";

export async function GET() {
  const user = process.env.ADMIN_USERNAME ?? "";
  const pass = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_JWT_SECRET ?? "";

  return NextResponse.json({
    ADMIN_USERNAME: {
      set: !!user,
      length: user.length,
      hex: Buffer.from(user, "utf8").toString("hex"),
      value: user,
    },
    ADMIN_PASSWORD: {
      set: !!pass,
      length: pass.length,
      hex: Buffer.from(pass, "utf8").toString("hex"),
    },
    ADMIN_JWT_SECRET: {
      set: !!secret,
      length: secret.length,
    },
  });
}
