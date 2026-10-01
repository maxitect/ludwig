// probe: removed in T015
import { revalidateTag } from "next/cache";
import { env } from "@/env";

export function GET() {
  if (env.VERCEL_ENV === "production") {
    return new Response(null, { status: 404 });
  }
  revalidateTag("probe", { expire: 0 });
  return Response.json({ revalidated: true });
}
