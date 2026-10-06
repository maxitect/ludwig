import { db } from "@/db";
import { env } from "@/env";
import { addDays, generateDailies } from "@/lib/data/gear-dailies";
import { difficulties } from "@/puzzles/gears/presets";
import { registry } from "@/puzzles/registry";
import { londonDate } from "@/utils/london-time";

export const maxDuration = 300;

const WINDOW_DAYS = 366;

export async function GET(request: Request) {
  const secret = env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
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
