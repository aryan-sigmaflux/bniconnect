"use client";

import type { MatchItem } from "@/types";

interface MatchedListProps {
  matches: MatchItem[];
}

export default function MatchedList({ matches }: MatchedListProps) {
  if (matches.length === 0) {
    return (
      <div className="likes-empty">
        <p>No matches yet</p>
        <span>When both of you like each other, it&apos;s a match!</span>
      </div>
    );
  }

  return (
    <div className="likes-grid">
      {matches.map((item) => (
        <div key={item.user.id} className="likes-card match-glow">
          <div className="likes-card-img">
            {item.user.profile_image ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/../uploads/${item.user.profile_image}`}
                alt={item.user.name}
              />
            ) : (
              <div className="likes-card-placeholder match-placeholder">
                {item.user.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="likes-card-info">
            <h3>{item.user.name}</h3>
            {item.user.business_name && <p>{item.user.business_name}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
