/**
 * Zustand store for swipe deck state management.
 */

import { create } from "zustand";
import type { UserCard } from "@/types";

interface SwipeState {
  stack: UserCard[];
  currentIndex: number;
  isLoading: boolean;
  matchedUser: UserCard | null;
  showMatch: boolean;

  setStack: (stack: UserCard[]) => void;
  nextCard: () => void;
  setLoading: (loading: boolean) => void;
  triggerMatch: (user: UserCard) => void;
  dismissMatch: () => void;
  reset: () => void;
}

export const useSwipeStore = create<SwipeState>((set) => ({
  stack: [],
  currentIndex: 0,
  isLoading: true,
  matchedUser: null,
  showMatch: false,

  setStack: (stack) => set({ stack, currentIndex: 0, isLoading: false }),

  nextCard: () =>
    set((state) => ({ currentIndex: state.currentIndex + 1 })),

  setLoading: (isLoading) => set({ isLoading }),

  triggerMatch: (user) => set({ matchedUser: user, showMatch: true }),

  dismissMatch: () => set({ matchedUser: null, showMatch: false }),

  reset: () =>
    set({
      stack: [],
      currentIndex: 0,
      isLoading: true,
      matchedUser: null,
      showMatch: false,
    }),
}));
