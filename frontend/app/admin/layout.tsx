"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/members", label: "Members", icon: "👥" },
  { href: "/admin/members/add", label: "Add Member", icon: "➕" },
  { href: "/admin/members/bulk", label: "Bulk Add", icon: "📁" },
  { href: "/admin/reset", label: "Reset Data", icon: "🔄" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Sigma<span>connect</span></h2>
          <span className="admin-role-badge">Admin</span>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${pathname === item.href ? "active" : ""}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/explore" className="admin-nav-item">
            <span className="admin-nav-icon">🔍</span>
            User View
          </Link>
          <button onClick={logout} className="admin-nav-item admin-logout-btn">
            <span className="admin-nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
