import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/utils/safe-redirect-path";

/** Landing point of the email verification link. Better Auth appends `error` when the token is bad. */
export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const target = searchParams.has("error")
    ? "/sign-in?error=verification"
    : safeRedirectPath(searchParams.get("next"));
  return NextResponse.redirect(new URL(target, request.url));
}
