import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

export default async function authMiddleware(request: NextRequest) {
  // Use internal URL for API calls to avoid SSL issues with reverse proxies
  const internalUrl = process.env.INTERNAL_URL || request.nextUrl.origin;

  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: internalUrl,
      headers: {
        //get the cookie from the request
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  const isLoginPage = request.nextUrl.pathname === "/login";

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isLoginPage && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (Service Worker)
     * - workbox-*.js (Workbox scripts)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)",
  ],
};
