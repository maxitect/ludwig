import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/env";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without the secret configured, nothing is authorised. */
export function isCronAuthorised(request: Request) {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  return timingSafeEqual(
    digest(request.headers.get("authorization") ?? ""),
    digest(`Bearer ${secret}`),
  );
}
