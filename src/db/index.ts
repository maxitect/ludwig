import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/env";
import { verifyFullSsl } from "@/utils/verify-full-ssl";
import { relations } from "./relations";

const pool = new Pool({
  connectionString: verifyFullSsl(env.DATABASE_URL),
  max: 5,
  idleTimeoutMillis: 5_000,
});

if (process.env.VERCEL) {
  attachDatabasePool(pool);
}

export const db = drizzle({
  client: pool,
  relations,
});
