"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { getUploadUrl } from "@/lib/uploads";
import type { MemberSwipeDetail, SwipedUserInfo } from "@/types";

type Tab = "liked" | "rejected" | "not_swiped";

export default function SwipeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const [data, setData] = useState<MemberSwipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("liked");

  useEffect(() => {
    api
      .get(`/admin/members/${memberId}/swipe-details`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Failed to load swipe details:", err))
      .finally(() => setLoading(false));
  }, [memberId]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Swipe Details</h1>
        <div className="likes-loading">
          <div className="deck-spinner" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Member Not Found</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => router.push("/admin")}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; color: string }[] = [
    { key: "liked", label: "Liked", count: data.liked.length, color: "var(--primary)" },
    { key: "rejected", label: "Rejected", count: data.rejected.length, color: "#666" },
    { key: "not_swiped", label: "Not Swiped", count: data.not_swiped.length, color: "#b0b0b0" },
  ];

  const currentList: SwipedUserInfo[] = data[tab];

  return (
    <div className="admin-page">
      <button
        className="detail-back-btn"
        onClick={() => router.push("/admin")}
      >
        ← Back to Dashboard
      </button>

      {/* Member header */}
      <div className="detail-header">
        <div className="detail-avatar">
          {data.member.profile_image ? (
            <img
              src={getUploadUrl(data.member.profile_image)}
              alt={data.member.name}
            />
          ) : (
            <span>{data.member.name.charAt(0)}</span>
          )}
        </div>
        <div className="detail-header-info">
          <h1 className="detail-name">{data.member.name}</h1>
          {data.member.business_name && (
            <p className="detail-biz">{data.member.business_name}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`detail-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
            style={
              tab === t.key
                ? { "--tab-color": t.color } as React.CSSProperties
                : undefined
            }
          >
            {t.label}
            <span className="detail-tab-count" style={{ background: t.color }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* User list */}
      {currentList.length === 0 ? (
        <div className="detail-empty">
          <span style={{ fontSize: 40 }}>📭</span>
          <p>No members in this category</p>
        </div>
      ) : (
        <div className="detail-grid">
          {currentList.map((u) => (
            <div key={u.id} className="detail-card">
              <div className="detail-card-avatar">
                {u.profile_image ? (
                  <img
                    src={getUploadUrl(u.profile_image)}
                    alt={u.name}
                  />
                ) : (
                  <span>{u.name.charAt(0)}</span>
                )}
              </div>
              <div className="detail-card-info">
                <h3>{u.name}</h3>
                {u.business_name && <p>{u.business_name}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
