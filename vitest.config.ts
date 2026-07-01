import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/elo.ts", "src/lib/attributes.ts", "src/lib/xp.ts"],
      exclude: ["src/lib/actions/**"],
    },
  },
  resolve: {
    alias: {
      "@":      path.resolve(__dirname, "./src"),
      "@lib":   path.resolve(__dirname, "./src/lib"),
      "@db":    path.resolve(__dirname, "./src/db"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },
})
