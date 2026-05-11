"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/members", label: "Members", icon: "👥" },
  { href: "/admin/members/add", label: "Add Member", icon: "➕" },
  { href: "/admin/members/bulk", label: "Bulk Add", icon: "📁" },
  { href: "/admin/members/bulk-images", label: "Bulk Images", icon: "🖼️" },
  { href: "/admin/reset", label: "Reset Data", icon: "🔄" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="admin-shell">
      {/* Desktop sidebar — unchanged */}
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

      {/* Mobile hamburger bar — only visible ≤768px */}
      <div className="admin-mobile-bar">
        <div className="admin-mobile-bar-title">
          <h2>Sigma<span>connect</span></h2>
          <span className="admin-role-badge">Admin</span>
        </div>
        <button
          id="admin-hamburger"
          className={`admin-hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>

      {/* Mobile slide-out overlay */}
      <div
        className={`admin-mobile-overlay ${menuOpen ? "visible" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <nav className={`admin-mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="admin-mobile-menu-items">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-mobile-link ${pathname === item.href ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="admin-mobile-menu-footer">
          <Link
            href="/explore"
            className="admin-mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            <span className="admin-nav-icon">🔍</span>
            User View
          </Link>
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="admin-mobile-link admin-logout-btn"
          >
            <span className="admin-nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </nav>

      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
