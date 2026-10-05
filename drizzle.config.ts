import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { verifyFullSsl } from "./src/utils/verify-full-ssl";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  dialect: "postgresql",
  schema: "src/db/schema/index.ts",
  out: "drizzle",
  dbCredentials: { url: verifyFullSsl(process.env.DATABASE_URL_UNPOOLED!) },
});
