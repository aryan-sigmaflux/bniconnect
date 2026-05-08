"use client";

import { useState } from "react";
import TopBar from "@/components/ui/TopBar";
import BottomNav from "@/components/ui/BottomNav";
import SentList from "@/components/likes/SentList";
import MatchedList from "@/components/likes/MatchedList";
import { useMatches } from "@/hooks/useMatches";

type Tab = "sent" | "matched";

export default function LikesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sent");
  const { sent, matches, matchedIds, isLoading } = useMatches();

  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">
        <div className="likes-tabs">
          <button
            className={`likes-tab ${activeTab === "sent" ? "active" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            Sent
            {sent.length > 0 && <span className="tab-count">{sent.length}</span>}
          </button>
          <button
            className={`likes-tab ${activeTab === "matched" ? "active" : ""}`}
            onClick={() => setActiveTab("matched")}
          >
            Matched
            {matches.length > 0 && <span className="tab-count match-count">{matches.length}</span>}
          </button>
        </div>

        {isLoading ? (
          <div className="likes-loading">
            <div className="deck-spinner" />
          </div>
        ) : activeTab === "sent" ? (
          <SentList sent={sent} matchedIds={matchedIds} />
        ) : (
          <MatchedList matches={matches} />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
