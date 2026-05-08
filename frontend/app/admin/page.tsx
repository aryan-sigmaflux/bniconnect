"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { AdminMemberResponse } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => {
    api.get("/admin/members").then((res) => {
      const members: AdminMemberResponse[] = res.data;
      setStats({
        total: members.length,
        active: members.filter((m) => m.is_active).length,
        inactive: members.filter((m) => !m.is_active).length,
      });
    });
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Members</span>
        </div>
        <div className="stat-card stat-active">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card stat-inactive">
          <span className="stat-value">{stats.inactive}</span>
          <span className="stat-label">Inactive</span>
        </div>
      </div>
    </div>
  );
}
