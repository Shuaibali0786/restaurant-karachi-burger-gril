import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic redirect for the admin panel (ADR-0002): a visitor with no session cookie is sent
 * straight to the login page instead of flashing a protected screen. This is a UX shortcut only —
 * every admin API route re-checks the session and role itself, since Proxy cannot see whether the
 * cookie's JWT is still valid or who it actually belongs to.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const hasSession = request.cookies.has("kbg_session");
  if (!hasSession) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
