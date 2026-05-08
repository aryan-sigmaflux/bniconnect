/**
 * Auth state hook — manages login state, tokens, and user info.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { setTokens, clearTokens, getAccessToken, getStoredUser } from "@/lib/auth";
import type { UserBrief, TokenResponse } from "@/types";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserBrief | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    const res = await api.post("/auth/send-otp", { phone });
    return res.data;
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, otp: string) => {
      const res = await api.post<TokenResponse>("/auth/verify-otp", { phone, otp });
      const { access_token, refresh_token, user: u } = res.data;

      // Store access token in cookie, refresh in httpOnly cookie via API route
      setTokens(access_token, u);
      await fetch("/api/auth/set-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
      });

      setUser(u);
      setIsAuthenticated(true);
      return u;
    },
    []
  );

  const logout = useCallback(() => {
    clearTokens();
    fetch("/api/auth/set-tokens", { method: "DELETE" });
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  return { user, isAuthenticated, isLoading, sendOtp, verifyOtp, logout };
}
