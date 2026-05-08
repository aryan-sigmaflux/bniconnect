"use client";

import Link from "next/link";
import type { AdminMemberResponse } from "@/types";

interface MemberTableProps {
  members: AdminMemberResponse[];
  onDeactivate: (id: string, name: string) => void;
}

export default function MemberTable({ members, onDeactivate }: MemberTableProps) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
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
              <td>
                <div className="admin-avatar">
                  {m.profile_image ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/../uploads/${m.profile_image}`}
                      alt={m.name}
                    />
                  ) : (
                    <span>{m.name.charAt(0)}</span>
                  )}
                </div>
              </td>
              <td className="admin-td-name">
                {m.name}
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
                  {m.is_active && !m.is_admin && (
                    <button
                      className="action-btn deactivate"
                      onClick={() => onDeactivate(m.id, m.name)}
                    >
                      Deactivate
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
