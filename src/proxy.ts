import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = getSessionCookie(request);

  if (pathname === "/") {
    return signedIn
      ? NextResponse.rewrite(new URL("/desk", request.url))
      : NextResponse.next();
  }
  if (signedIn) return NextResponse.next();

  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", pathname + search);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    "/casebook/:path*",
    "/settings/:path*",
    {
      source: "/",
      has: [{ type: "cookie", key: "better-auth.session_token" }],
    },
    {
      source: "/",
      has: [{ type: "cookie", key: "__Secure-better-auth.session_token" }],
    },
  ],
};
