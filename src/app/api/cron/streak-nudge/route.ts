import { authBaseURL } from "@/lib/auth";
import { runStreakNudge } from "@/lib/email/dispatch";
import { isCronAuthorised } from "@/utils/cron-auth";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthorised(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(
    await runStreakNudge(authBaseURL ?? new URL(request.url).origin),
  );
}
