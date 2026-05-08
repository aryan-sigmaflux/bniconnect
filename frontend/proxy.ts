/**
 * Next.js middleware for route protection.
 * Checks for valid JWT in cookies and enforces admin-only access.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  // Public routes — allow without auth
  const publicPaths = ["/login", "/api/auth", "/api/v1/auth", "/uploads", "/api/uploads"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    // If already logged in, redirect away from login
    if (pathname === "/login" && token) {
      const payload = decodeJwtPayload(token);
      if (payload && typeof payload.exp === "number" && Date.now() < payload.exp * 1000) {
        const isAdmin = payload.is_admin === true;
        return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/explore", request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes — require auth
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number" || Date.now() >= payload.exp * 1000) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("access_token");
    return response;
  }

  const isAdmin = payload.is_admin === true;

  // Admin routes — require admin role
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/explore", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/).*)",
  ],
};
