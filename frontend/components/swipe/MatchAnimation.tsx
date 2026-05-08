"use client";

import { useEffect } from "react";
import type { UserCard } from "@/types";

interface MatchAnimationProps {
  user: UserCard;
  onDismiss: () => void;
}

export default function MatchAnimation({ user, onDismiss }: MatchAnimationProps) {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="match-overlay" onClick={onDismiss}>
      {/* Floating hearts */}
      <div className="match-confetti">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="confetti-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              color: ["#F53D6B", "#FF5B84", "#FFA4B6"][i % 3],
              fontSize: `${12 + Math.random() * 16}px`,
              opacity: 0.6,
            }}
          >
            ♥
          </span>
        ))}
      </div>

      <div className="match-content">
        <h1 className="match-title">It&apos;s a Match!</h1>
        <p className="match-subtitle">You and {user.name} liked each other</p>

        <div className="match-profiles">
          <div className="match-avatar">
            {user.profile_image ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/../uploads/${user.profile_image}`}
                alt={user.name}
              />
            ) : (
              <span>{user.name.charAt(0)}</span>
            )}
          </div>
        </div>

        <p className="match-tap">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
