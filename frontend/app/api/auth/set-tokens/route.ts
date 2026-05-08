/**
 * API route to set/clear refresh token as httpOnly cookie.
 * POST: set refresh_token cookie
 * DELETE: clear refresh_token cookie
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { refresh_token } = body;

  if (!refresh_token) {
    return NextResponse.json({ error: "Missing refresh_token" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("refresh_token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("refresh_token");
  response.cookies.delete("access_token");
  return response;
}
