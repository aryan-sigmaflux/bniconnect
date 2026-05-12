"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import MemberTable from "@/components/admin/MemberTable";
import type { AdminMemberResponse } from "@/types";

export default function MembersPage() {
  const [members, setMembers] = useState<AdminMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const res = await api.get("/admin/members");
      setMembers(res.data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/members/${id}`);
      fetchMembers();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleSelectToggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allDeletableIds = members.filter(m => !m.is_admin).map(m => m.id);
      setSelectedIds(new Set(allDeletableIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.size} selected members? This action cannot be undone.`)) return;
    try {
      await api.post("/admin/members/bulk-delete", { member_ids: Array.from(selectedIds) });
      fetchMembers();
    } catch (err) {
      console.error("Bulk delete failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Members</h1>
        <div className="likes-loading"><div className="deck-spinner" /></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Members ({members.length})</h1>
        {selectedIds.size > 0 && (
          <button 
            onClick={handleBulkDelete}
            style={{ 
              backgroundColor: "var(--primary)", 
              color: "white", 
              padding: "8px 16px", 
              borderRadius: "8px", 
              border: "none", 
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Delete Selected ({selectedIds.size})
          </button>
        )}
      </div>
      <MemberTable 
        members={members} 
        onDelete={handleDelete} 
        selectedIds={selectedIds}
        onSelectToggle={handleSelectToggle}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
}
