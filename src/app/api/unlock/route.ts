import { NextResponse } from "next/server";
import { LOCK_COOKIE, lockToken } from "@/lib/site-lock";

// Checks the password typed on the Coming soon page and, if right, lets this browser in for 30 days.
export async function POST(request: Request) {
  const password = process.env.SITE_LOCK_PASSWORD;
  const form = await request.formData();
  const typed = String(form.get("password") ?? "");

  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  if (!password || typed !== password) {
    return NextResponse.redirect(new URL(password ? "/?wrong=1" : "/", site), 303);
  }

  const response = NextResponse.redirect(new URL("/", site), 303);
  response.cookies.set(LOCK_COOKIE, await lockToken(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
