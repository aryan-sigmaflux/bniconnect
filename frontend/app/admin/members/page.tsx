"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import MemberTable from "@/components/admin/MemberTable";
import type { AdminMemberResponse } from "@/types";

export default function MembersPage() {
  const [members, setMembers] = useState<AdminMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
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
      <h1 className="admin-page-title">Members ({members.length})</h1>
      <MemberTable members={members} onDelete={handleDelete} />
    </div>
  );
}
