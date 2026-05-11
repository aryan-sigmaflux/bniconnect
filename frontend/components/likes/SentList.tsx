"use client";

import type { SentSwipeItem } from "@/types";
import { getUploadUrl } from "@/lib/uploads";

interface SentListProps {
  sent: SentSwipeItem[];
  matchedIds: Set<string>;
}

export default function SentList({ sent, matchedIds }: SentListProps) {
  if (sent.length === 0) {
    return (
      <div className="likes-empty">
        <p>No likes sent yet</p>
        <span>Start exploring to connect with people!</span>
      </div>
    );
  }

  return (
    <div className="likes-grid">
      {sent.map((item) => {
        const isMatched = matchedIds.has(item.user.id);
        return (
          <div key={item.user.id} className={`likes-card ${isMatched ? "matched" : ""}`}>
            <div className="likes-card-img">
              {item.user.profile_image ? (
                <img
                  src={getUploadUrl(item.user.profile_image)}
                  alt={item.user.name}
                />
              ) : (
                <div className="likes-card-placeholder">
                  {item.user.name.charAt(0)}
                </div>
              )}
              {isMatched && <span className="likes-matched-badge">Matched ✓</span>}
            </div>
            <div className="likes-card-info">
              <h3>{item.user.name}</h3>
              {item.user.business_name && <p>{item.user.business_name}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
