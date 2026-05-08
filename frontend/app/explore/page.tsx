"use client";

import TopBar from "@/components/ui/TopBar";
import BottomNav from "@/components/ui/BottomNav";
import SwipeDeck from "@/components/swipe/SwipeDeck";

export default function ExplorePage() {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main explore-main">
        <SwipeDeck />
      </main>
      <BottomNav />
    </div>
  );
}
