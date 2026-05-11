"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getUploadUrl } from "@/lib/uploads";
import type { MemberSwipeStats } from "@/types";

type SortField = "name" | "liked_count" | "rejected_count";
type SortDir = "asc" | "desc";

export default function AdminDashboard() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberSwipeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    api
      .get("/admin/members/swipe-stats")
      .then((res) => setMembers(res.data))
      .catch((err) => console.error("Failed to fetch swipe stats:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="sort-icon inactive">⬍</span>;
    return sortDir === "desc" ? (
      <span className="sort-icon active">▼</span>
    ) : (
      <span className="sort-icon active">▲</span>
    );
  };

  const filtered = useMemo(() => {
    let list = members;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return list;
  }, [members, search, sortField, sortDir]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Dashboard</h1>
        <div className="likes-loading">
          <div className="deck-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>

      {/* Single stat card — Total Members */}
      <div className="admin-stats" style={{ gridTemplateColumns: "1fr", maxWidth: 280 }}>
        <div className="stat-card">
          <span className="stat-value">{members.length}</span>
          <span className="stat-label">Total Members</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="dash-search-wrap">
        <span className="dash-search-icon">🔍</span>
        <input
          id="member-search"
          className="dash-search-input"
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Sortable table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}></th>
              <th
                className="sortable-th"
                onClick={() => handleSort("name")}
              >
                Member {sortIcon("name")}
              </th>
              <th
                className="sortable-th"
                onClick={() => handleSort("liked_count")}
              >
                Liked {sortIcon("liked_count")}
              </th>
              <th
                className="sortable-th"
                onClick={() => handleSort("rejected_count")}
              >
                Rejected {sortIcon("rejected_count")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#999" }}>
                  No members found
                </td>
              </tr>
            )}
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="dash-row"
                onClick={() => router.push(`/admin/swipe-details/${m.id}`)}
              >
                <td>
                  <div className="admin-avatar">
                    {m.profile_image ? (
                      <img
                        src={getUploadUrl(m.profile_image)}
                        alt={m.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 18, fontWeight: 700, opacity: 0.2 }}>
                        {m.name.charAt(0)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="admin-td-name">{m.name}</td>
                <td>
                  <span className="dash-badge dash-badge-liked">{m.liked_count}</span>
                </td>
                <td>
                  <span className="dash-badge dash-badge-rejected">{m.rejected_count}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
