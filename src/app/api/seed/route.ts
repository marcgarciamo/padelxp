import { NextResponse } from "next/server";
import { seedDatabase } from "@lib/seed";

export async function GET() {
  if (process.env["NODE_ENV"] === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }
  await seedDatabase();
  return NextResponse.json({ ok: true });
}
