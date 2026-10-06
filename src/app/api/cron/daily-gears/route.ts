import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { env } from "@/env";
import { generateDailies } from "@/lib/data/gear-dailies";
import { difficulties } from "@/puzzles/gears/presets";
import { registry } from "@/puzzles/registry";
import { addDays, londonDate } from "@/utils/london-time";

export const maxDuration = 300;

const WINDOW_DAYS = 366;

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

  const from = londonDate(new Date());
  const summary = await generateDailies(db, registry, {
    from,
    days: WINDOW_DAYS,
    cycle: difficulties,
  });
  return Response.json({ from, through: addDays(from, WINDOW_DAYS - 1), ...summary });
}
