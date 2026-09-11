import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

export const GUEST_COOKIE = "dh_guest";
export const GUEST_HEADER = "x-dh-guest";

const { auth } = NextAuth(authConfig);

function makeGuestId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function isValidGuestId(raw: string) {
  return /^[a-zA-Z0-9_-]{8,64}$/.test(raw);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!req.auth?.user) {
      const login = new URL("/login", req.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }

    if (req.auth.user.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname === "/admin" || pathname === "/admin/") {
      return NextResponse.redirect(new URL("/admin/products", req.url));
    }

    return NextResponse.next();
  }

  const existing = req.cookies.get(GUEST_COOKIE)?.value?.trim() ?? "";
  const guestId = isValidGuestId(existing) ? existing : makeGuestId();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(GUEST_HEADER, guestId);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (guestId !== existing) {
    res.cookies.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return res;
});

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|uploads|api/auth|api/health|api/cron).*)",
  ],
};
