/**
 * Touch/mouse gesture detection for swipe cards.
 * Returns drag state and handlers for the interactive card.
 */

"use client";

import { useState, useRef, useCallback } from "react";

interface SwipeGesture {
  offsetX: number;
  offsetY: number;
  rotation: number;
  isDragging: boolean;
  direction: "left" | "right" | null;
  opacity: number;
}

interface UseSwipeOptions {
  threshold?: number; // fraction of screen width (default 0.4)
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const INITIAL: SwipeGesture = {
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  isDragging: false,
  direction: null,
  opacity: 0,
};

export function useSwipe({ threshold = 0.15, onSwipeLeft, onSwipeRight }: UseSwipeOptions) {
  const [gesture, setGesture] = useState<SwipeGesture>(INITIAL);
  const startPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const getScreenWidth = () =>
    typeof window !== "undefined" ? window.innerWidth : 400;

  const updateGesture = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    const sw = getScreenWidth();
    const progress = Math.min(Math.abs(dx) / (sw * threshold), 1);

    setGesture({
      offsetX: dx,
      offsetY: dy * 0.3,
      rotation: dx * 0.06,
      isDragging: true,
      direction: dx > 30 ? "right" : dx < -30 ? "left" : null,
      opacity: progress,
    });
  }, [threshold]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startPos.current = { x: clientX, y: clientY };
    setGesture((g) => ({ ...g, isDragging: true }));
  }, []);

  const handleEnd = useCallback(() => {
    const sw = getScreenWidth();
    const absX = Math.abs(gesture.offsetX);

    if (absX > sw * threshold) {
      // Confirmed swipe — animate out
      const dir = gesture.offsetX > 0 ? 1 : -1;
      setGesture((g) => ({
        ...g,
        offsetX: dir * sw * 1.5,
        rotation: dir * 30,
        isDragging: false,
      }));

      setTimeout(() => {
        if (dir > 0) onSwipeRight?.();
        else onSwipeLeft?.();
        setGesture(INITIAL);
      }, 300);
    } else {
      // Snap back
      setGesture(INITIAL);
    }
  }, [gesture.offsetX, threshold, onSwipeLeft, onSwipeRight]);

  // Programmatic swipe (for buttons)
  const triggerSwipe = useCallback(
    (direction: "left" | "right") => {
      const sw = getScreenWidth();
      const dir = direction === "right" ? 1 : -1;
      setGesture({
        offsetX: dir * sw * 1.5,
        offsetY: 0,
        rotation: dir * 30,
        isDragging: false,
        direction,
        opacity: 1,
      });
      setTimeout(() => {
        if (direction === "right") onSwipeRight?.();
        else onSwipeLeft?.();
        setGesture(INITIAL);
      }, 350);
    },
    [onSwipeLeft, onSwipeRight]
  );

  // Event handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY),
    [handleStart]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!gesture.isDragging) return;
      updateGesture(e.touches[0].clientX, e.touches[0].clientY);
    },
    [gesture.isDragging, updateGesture]
  );

  const onTouchEnd = useCallback(() => handleEnd(), [handleEnd]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!gesture.isDragging) return;
      updateGesture(e.clientX, e.clientY);
    },
    [gesture.isDragging, updateGesture]
  );

  const onMouseUp = useCallback(() => handleEnd(), [handleEnd]);

  return {
    gesture,
    cardRef,
    triggerSwipe,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
    },
  };
}
