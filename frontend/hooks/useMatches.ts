/**
 * Hook to fetch and cache match/likes data for the Likes page.
 * Auto-polls every 15 seconds so the UI stays in sync without manual refresh.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import type { SentSwipeItem, MatchItem } from "@/types";

const POLL_INTERVAL_MS = 1_000; // 15 seconds

export function useMatches() {
  const [sent, setSent] = useState<SentSwipeItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [sentRes, matchRes] = await Promise.all([
        api.get("/swipes/sent"),
        api.get("/swipes/matches"),
      ]);
      setSent(sentRes.data.sent);
      setMatches(matchRes.data.matches);
    } catch (err) {
      console.error("Failed to load matches:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch (shows loading spinner)
    fetchData(false);

    // Start polling (silent — no loading spinner on subsequent fetches)
    intervalRef.current = setInterval(() => {
      fetchData(true);
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const matchedIds = new Set(matches.map((m) => m.user.id));

  return { sent, matches, matchedIds, isLoading, refetch: fetchData };
}
