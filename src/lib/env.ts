import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL:         z.string().url(),
    BETTER_AUTH_SECRET:   z.string().min(32),
    NODE_ENV:             z.enum(["development", "production", "test"]).default("development"),
    GOOGLE_CLIENT_ID:     z.string().min(10),
    GOOGLE_CLIENT_SECRET: z.string().min(10),
    RECALCULATE_SECRET:   z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL:      z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
    NEXT_PUBLIC_APP_URL:           z.string().url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    DATABASE_URL:                  process.env["DATABASE_URL"],
    BETTER_AUTH_SECRET:            process.env["BETTER_AUTH_SECRET"],
    NODE_ENV:                      process.env["NODE_ENV"],
    GOOGLE_CLIENT_ID:              process.env["GOOGLE_CLIENT_ID"],
    GOOGLE_CLIENT_SECRET:          process.env["GOOGLE_CLIENT_SECRET"],
    RECALCULATE_SECRET:            process.env["RECALCULATE_SECRET"],
    NEXT_PUBLIC_SUPABASE_URL:      process.env["NEXT_PUBLIC_SUPABASE_URL"],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    NEXT_PUBLIC_APP_URL:           process.env["NEXT_PUBLIC_APP_URL"],
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || !process.env.DATABASE_URL,
});
