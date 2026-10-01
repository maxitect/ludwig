// probe: removed in T015
import "server-only";
import { sql } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { db } from "@/db";

export async function getProbeTime() {
  "use cache";
  cacheTag("probe");
  const { rows } = await db.execute<{ now: string }>(
    sql`select now()::text as now`,
  );
  return rows[0].now;
}
