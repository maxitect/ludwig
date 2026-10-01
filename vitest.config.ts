import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgres://ludwig:ludwig@localhost:5432/ludwig",
      DATABASE_URL_UNPOOLED:
        process.env.DATABASE_URL_UNPOOLED ??
        "postgres://ludwig:ludwig@localhost:5432/ludwig",
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        "test-secret-test-secret-test-secret-1234",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    },
  },
});
