"use client";

import { useEffect } from "react";
import type { UserCard } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface MatchAnimationProps {
  user: UserCard;
  onDismiss: () => void;
}

export default function MatchAnimation({ user, onDismiss }: MatchAnimationProps) {
  const { user: currentUser } = useAuth();

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getImgSrc = (image: string | null) => 
    image ? `${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/../uploads/${image}` : null;

  return (
    <div className="match-overlay" onClick={onDismiss}>
      <div className="match-content">
        <h1 className="match-title">It&apos;s a Match!</h1>
        <p className="match-subtitle">You and {user.name} matched with each other</p>

        <div className="match-profiles">
          {/* Current User */}
          <div className="match-avatar-wrapper">
            <div className="match-avatar avatar-left">
              {currentUser?.profile_image ? (
                <img src={getImgSrc(currentUser.profile_image)!} alt="You" />
              ) : (
                <span>{currentUser?.name?.charAt(0) || "U"}</span>
              )}
            </div>
          </div>

          {/* Matched User */}
          <div className="match-avatar-wrapper">
            <div className="match-avatar avatar-right">
              {user.profile_image ? (
                <img src={getImgSrc(user.profile_image)!} alt={user.name} />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>
          </div>
        </div>

        <p className="match-tap">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
