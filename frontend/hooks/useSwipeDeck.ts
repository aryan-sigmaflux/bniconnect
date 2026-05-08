/**
 * Deck state management hook — loads stack, handles swipe actions.
 */

"use client";

import { useEffect, useCallback } from "react";
import api from "@/lib/api";
import { likedMeCache } from "@/lib/cache";
import { useSwipeStore } from "@/store/swipeStore";
import type { SwipeResponse, UserCard } from "@/types";

export function useSwipeDeck() {
  const {
    stack, currentIndex, isLoading,
    setStack, nextCard, setLoading, triggerMatch,
  } = useSwipeStore();

  // Load stack + liked-me cache on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [stackRes, cacheRes] = await Promise.all([
          api.get("/users/stack"),
          api.get("/users/liked-me-cache"),
        ]);
        if (cancelled) return;
        setStack(stackRes.data.stack);
        likedMeCache.load(cacheRes.data);
      } catch (err) {
        console.error("Failed to load deck:", err);
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [setStack, setLoading]);

  const currentCard: UserCard | null = stack[currentIndex] ?? null;
  const cardsRemaining = Math.max(0, stack.length - currentIndex);

  const handleSwipe = useCallback(
    async (direction: "like" | "reject") => {
      if (!currentCard) return;

      const targetId = currentCard.id;

      // Optimistic match check
      if (direction === "like" && likedMeCache.has(targetId)) {
        triggerMatch(currentCard);
      }

      nextCard();

      try {
        const res = await api.post<SwipeResponse>("/swipes", {
          swiped_id: targetId,
          direction,
        });
        // Server confirmed match (in case cache missed it)
        if (res.data.matched && res.data.matched_user) {
          triggerMatch(res.data.matched_user);
        }
      } catch (err) {
        console.error("Swipe failed:", err);
      }
    },
    [currentCard, nextCard, triggerMatch]
  );

  return {
    currentCard,
    stack,
    currentIndex,
    cardsRemaining,
    isLoading,
    handleSwipe,
  };
}
