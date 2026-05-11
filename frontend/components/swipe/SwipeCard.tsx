"use client";

import type { UserCard } from "@/types";

interface SwipeCardProps {
  user: UserCard;
  style?: React.CSSProperties;
  interactive?: boolean;
  handlers?: Record<string, (e: never) => void>;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  overlayDirection?: "left" | "right" | null;
  overlayOpacity?: number;
}

export default function SwipeCard({
  user,
  style,
  interactive = false,
  handlers = {},
  cardRef,
  overlayDirection,
  overlayOpacity = 0,
}: SwipeCardProps) {
  const imgSrc = user.profile_image
    ? `${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/../uploads/${user.profile_image}`
    : null;

  return (
    <div
      ref={cardRef}
      className={`swipe-card ${interactive ? "interactive" : ""}`}
      style={{
        ...style,
        touchAction: interactive ? "none" : undefined,
        userSelect: "none",
        backgroundColor: "#EBEBEB",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "40px",
        boxShadow: "0 10px 30px rgba(207, 6, 6, 0.25)",
      }}
      {...handlers}
    >
      <div
        className="swipe-card-image"
        style={{
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          overflow: "hidden",
          border: "2px solid black",
          boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
          flexShrink: 0,
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={user.name}
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        ) : (
          <div className="swipe-card-placeholder" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "var(--surface)" }}>
            <span style={{ fontSize: "60px", fontWeight: "bold", color: "var(--text-muted)", opacity: 0.3 }}>{user.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Swipe overlays */}
      {overlayDirection === "right" && (
        <div className="swipe-overlay swipe-overlay-like" style={{ opacity: overlayOpacity }}>
          <span>1-2-1</span>
        </div>
      )}
      {overlayDirection === "left" && (
        <div className="swipe-overlay swipe-overlay-nope" style={{ opacity: overlayOpacity }}>
          <span>NOT NOW</span>
        </div>
      )}

      {/* Info Section */}
      <div
        className="swipe-card-info"
        style={{
          marginTop: "24px",
          textAlign: "center",
          padding: "0 24px",
          background: "none",
          position: "static",
        }}
      >
        <h2
          className="swipe-card-name"
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "var(--primary)",
            margin: "0 0 8px 0",
            textShadow: "none",
          }}
        >
          {user.name}
        </h2>
        {user.business_name && (
          <p
            className="swipe-card-biz"
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#1A1A1A",
              margin: 0,
              opacity: 0.9,
            }}
          >
            {user.business_name}
          </p>
        )}
        {user.business_category && (
          <p
            className="swipe-card-category"
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "var(--primary)",
              margin: "4px 0 0 0",
              opacity: 0.8,
            }}
          >
            {user.business_category}
          </p>
        )}

      </div>

    </div>
  );
}
