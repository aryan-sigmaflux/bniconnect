/**
 * Hook to fetch and cache match/likes data for the Likes page.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import type { SentSwipeItem, MatchItem } from "@/types";

export function useMatches() {
  const [sent, setSent] = useState<SentSwipeItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const matchedIds = new Set(matches.map((m) => m.user.id));

  return { sent, matches, matchedIds, isLoading, refetch: fetchData };
}
