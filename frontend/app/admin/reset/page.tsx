"use client";

import { useState } from "react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";

export default function ResetPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!confirm("⚠️ This will permanently delete ALL swipe and match data. Continue?")) return;
    if (!confirm("Are you absolutely sure? This action CANNOT be undone.")) return;

    setLoading(true);
    try {
      await api.post("/admin/reset");
      setDone(true);
    } catch (err) {
      console.error("Reset failed:", err);
      alert("Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Reset All Data</h1>

      <div className="reset-card">
        <div className="reset-icon">⚠️</div>
        <h2>Danger Zone</h2>
        <p>
          This will permanently delete <strong>all swipes and matches</strong> from the database
          and flush all cached data from Redis. All users will start fresh.
        </p>
        <ul className="reset-list">
          <li>All swipe history will be erased</li>
          <li>All matches will be removed</li>
          <li>All cached stacks will be cleared</li>
          <li>User accounts will remain intact</li>
        </ul>

        {done ? (
          <div className="reset-success">
            <span>✅</span> All swipe data has been reset successfully.
          </div>
        ) : (
          <Button variant="danger" onClick={handleReset} isLoading={loading} size="lg">
            Reset All Swipe Data
          </Button>
        )}
      </div>
    </div>
  );
}
