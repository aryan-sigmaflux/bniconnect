"use client";

import { useSwipeDeck } from "@/hooks/useSwipeDeck";
import { useSwipe } from "@/hooks/useSwipe";
import { useSwipeStore } from "@/store/swipeStore";
import SwipeCard from "./SwipeCard";
import SwipeButtons from "./SwipeButtons";
import EndOfStack from "./EndOfStack";
import MatchAnimation from "./MatchAnimation";

export default function SwipeDeck() {
  const { currentCard, stack, currentIndex, cardsRemaining, isLoading, handleSwipe } =
    useSwipeDeck();
  const { showMatch, matchedUser, dismissMatch } = useSwipeStore();

  const { gesture, handlers, triggerSwipe } = useSwipe({
    onSwipeRight: () => handleSwipe("like"),
    onSwipeLeft: () => handleSwipe("reject"),
  });

  if (isLoading) {
    return (
      <div className="deck-loading">
        <div className="deck-spinner" />
        <p>Finding people for you...</p>
      </div>
    );
  }

  if (cardsRemaining === 0) {
    return (
      <>
        <EndOfStack />
        {showMatch && matchedUser && (
          <MatchAnimation user={matchedUser} onDismiss={dismissMatch} />
        )}
      </>
    );
  }

  // Render top 3 cards (only top is interactive)
  const visibleCards = stack.slice(currentIndex, currentIndex + 3);

  return (
    <>
      <div className="deck-container">
        <div className="deck-stack">
          {visibleCards
            .map((user, i) => {
              const isTop = i === 0;
              const scale = 1 - i * 0.05;
              const translateY = i * 8;

              const cardStyle: React.CSSProperties = isTop
                ? {
                    transform: `translateX(${gesture.offsetX}px) translateY(${gesture.offsetY}px) rotate(${gesture.rotation}deg)`,
                    transition: gesture.isDragging ? "none" : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    zIndex: 10 - i,
                  }
                : {
                    transform: `scale(${scale}) translateY(${translateY}px)`,
                    zIndex: 10 - i,
                    pointerEvents: "none" as const,
                  };

              return (
                <SwipeCard
                  key={user.id}
                  user={user}
                  style={cardStyle}
                  interactive={isTop}
                  handlers={isTop ? handlers : {}}
                  overlayDirection={isTop ? gesture.direction : null}
                  overlayOpacity={isTop ? gesture.opacity : 0}
                />
              );
            })
            .reverse()}
        </div>
      </div>

      <SwipeButtons
        onReject={() => triggerSwipe("left")}
        onLike={() => triggerSwipe("right")}
        disabled={!currentCard}
      />

      {showMatch && matchedUser && (
        <MatchAnimation user={matchedUser} onDismiss={dismissMatch} />
      )}
    </>
  );
}
