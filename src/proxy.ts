import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCK_COOKIE, lockToken } from "@/lib/site-lock";

// Pages that stay open even while the site is locked.
const OPEN_PATHS = ["/locked", "/api/unlock", "/api/paystack/webhook"];

export async function proxy(request: NextRequest) {
  const password = process.env.SITE_LOCK_PASSWORD;
  if (!password) return NextResponse.next(); // lock is off: the site is public

  const { pathname } = request.nextUrl;
  if (OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  if (request.cookies.get(LOCK_COOKIE)?.value === (await lockToken(password))) return NextResponse.next();

  const locked = NextResponse.rewrite(new URL("/locked", request.url), { status: 503 });
  locked.headers.set("X-Robots-Tag", "noindex, nofollow");
  locked.headers.set("Retry-After", "86400");
  return locked;
}

export const config = {
  // Skip Next.js internal files so the Coming soon page can load its styles and fonts.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
