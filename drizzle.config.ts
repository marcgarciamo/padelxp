import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema:    "./src/db/*.ts",
  out:       "./src/db/migrations",
  dialect:   "postgresql",
  dbCredentials: {
    url:  process.env["DATABASE_URL"]!,
    ssl:  true,
  },
  verbose: true,
  strict:  true,
});