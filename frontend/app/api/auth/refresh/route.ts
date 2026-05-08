/**
 * API route to silently refresh the access token using the httpOnly refresh_token cookie.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const apiUrl = process.env.API_URL || "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      const response = NextResponse.json({ error: "Refresh failed" }, { status: 401 });
      response.cookies.delete("refresh_token");
      response.cookies.delete("access_token");
      return response;
    }

    const data = await res.json();

    const response = NextResponse.json({ ok: true, user: data.user });

    // Update access token cookie (readable by client JS)
    response.cookies.set("access_token", data.access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    // Update refresh token cookie (httpOnly)
    response.cookies.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Refresh request failed" }, { status: 500 });
  }
}
