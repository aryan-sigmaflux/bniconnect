"use client";

import Link from "next/link";
import type { AdminMemberResponse } from "@/types";
import { getUploadUrl } from "@/lib/uploads";

interface MemberTableProps {
  members: AdminMemberResponse[];
  onDelete: (id: string, name: string) => void;
  selectedIds?: Set<string>;
  onSelectToggle?: (id: string) => void;
  onSelectAll?: (checked: boolean) => void;
}

export default function MemberTable({ members, onDelete, selectedIds = new Set(), onSelectToggle, onSelectAll }: MemberTableProps) {
  const deletableMembers = members.filter(m => !m.is_admin);
  const allSelected = deletableMembers.length > 0 && selectedIds.size === deletableMembers.length;
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: "40px", textAlign: "center" }}>
              <input 
                type="checkbox" 
                checked={allSelected}
                onChange={(e) => onSelectAll?.(e.target.checked)}
                className="admin-checkbox"
              />
            </th>
            <th>Photo</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Business</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className={!m.is_active ? "inactive-row" : ""}>
              <td style={{ textAlign: "center" }}>
                {!m.is_admin && (
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(m.id)}
                    onChange={() => onSelectToggle?.(m.id)}
                    className="admin-checkbox"
                  />
                )}
              </td>
              <td>
                <div className="admin-avatar">
                  {m.profile_image ? (
                    <img
                      src={getUploadUrl(m.profile_image)}
                      alt={m.name}
                    />
                  ) : (
                    <span>{m.name.charAt(0)}</span>
                  )}
                </div>
              </td>
              <td className="admin-td-name">
                {m.name}{" "}
                {m.is_admin && <span className="admin-badge">Admin</span>}
              </td>
              <td>{m.phone}</td>
              <td>{m.business_name || "—"}</td>
              <td>
                <span className={`status-pill ${m.is_active ? "active" : "inactive"}`}>
                  {m.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <div className="admin-actions">
                  <Link href={`/admin/members/${m.id}`} className="action-btn edit">
                    Edit
                  </Link>
                  {!m.is_admin && (
                    <button
                      className="action-btn delete"
                      style={{ color: "var(--primary)", fontWeight: "600" }}
                      onClick={() => onDelete(m.id, m.name)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
