import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";
import { env } from "@lib/env";

const client = postgres(env.DATABASE_URL, {
  max: 1,
  ssl: "require",
});

export const db = drizzle(client, {
  schema: { ...schema, ...authSchema },
  logger: env.NODE_ENV === "development",
});

export type DB = typeof db;
