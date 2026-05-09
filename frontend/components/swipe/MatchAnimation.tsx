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
      <div className="match-content">
        <h1 className="match-title">It&apos;s a Match!</h1>
        <p className="match-subtitle">You and {user.name} matched with each other</p>

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
