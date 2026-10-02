import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./src/db/integrity/test-database";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://ludwig:ludwig@localhost:5432/ludwig";
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED ?? databaseUrl;
process.env.INTEGRITY_ADMIN_DATABASE_URL = unpooledUrl;

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
    globalSetup: ["src/db/integrity/global-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    env: {
      DATABASE_URL: testDatabaseUrl(databaseUrl),
      DATABASE_URL_UNPOOLED: testDatabaseUrl(unpooledUrl),
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        "test-secret-test-secret-test-secret-1234",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    },
  },
});
