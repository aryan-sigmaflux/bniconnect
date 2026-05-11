"use client";

import { X, Handshake } from "lucide-react";

interface SwipeButtonsProps {
  onReject: () => void;
  onLike: () => void;
  disabled?: boolean;
}

export default function SwipeButtons({ onReject, onLike, disabled }: SwipeButtonsProps) {
  return (
    <div className="swipe-buttons">
      <button
        className="swipe-btn swipe-btn-reject"
        onClick={onReject}
        disabled={disabled}
        aria-label="Not now"
      >
        <X size={28} strokeWidth={2.5} />
      </button>
      <button
        className="swipe-btn swipe-btn-like"
        onClick={onLike}
        disabled={disabled}
        aria-label="1-2-1"
      >
        <Handshake size={28} />
      </button>
    </div>
  );
}
