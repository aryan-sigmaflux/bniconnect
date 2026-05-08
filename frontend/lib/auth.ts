/**
 * Token storage, decode, and management utilities.
 */

import Cookies from "js-cookie";
import type { UserBrief } from "@/types";

const USER_KEY = "sc_user";

export function setTokens(accessToken: string, user: UserBrief) {
  Cookies.set("access_token", accessToken, { expires: 7, sameSite: "lax" });
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearTokens() {
  Cookies.remove("access_token");
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY);
  }
}

export function getAccessToken(): string | undefined {
  return Cookies.get("access_token");
}

export function getStoredUser(): UserBrief | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserBrief;
  } catch {
    return null;
  }
}

/** Decode JWT payload without verification (client-side only). */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return Date.now() >= payload.exp * 1000;
}
