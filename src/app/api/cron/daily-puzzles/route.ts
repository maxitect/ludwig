import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { dailyTypes } from "@/config/daily-types";
import { env } from "@/env";
import { generateDailies } from "@/lib/data/daily-puzzles";
import { registry } from "@/puzzles/registry";
import { addDays, londonDate } from "@/utils/london-time";

export const maxDuration = 300;

const WINDOW_DAYS = 366;

/** Stops starting dates here, so a long backfill ends cleanly before `maxDuration`. The next run resumes it. */
const RUN_BUDGET_MS = 270_000;

const digest = (value: string) => createHash("sha256").update(value).digest();

function isAuthorised(request: Request) {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  return timingSafeEqual(
    digest(request.headers.get("authorization") ?? ""),
    digest(`Bearer ${secret}`),
  );
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const deadline = Date.now() + RUN_BUDGET_MS;
  const from = londonDate(new Date());
  const types = [];
  for (const typeKey of dailyTypes) {
    const summary = await generateDailies(db, registry, {
      typeKey,
      from,
      days: WINDOW_DAYS,
      deadline,
    });
    const pending = WINDOW_DAYS - summary.created - summary.skipped;
    types.push({ typeKey, ...summary, pending });
  }
  return Response.json({ from, through: addDays(from, WINDOW_DAYS - 1), types });
}
