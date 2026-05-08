"use client";

import { useAuth } from "@/hooks/useAuth";

export default function TopBar() {
  const { logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="topbar-logout" aria-label="Back" title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="topbar-logo" style={{ alignItems: 'center' }}>
          <h1 className="topbar-title">Sigmaconnect</h1>
          <span className="topbar-subtitle">Discovering members</span>
        </div>
        <button onClick={logout} className="topbar-logout" aria-label="Logout" title="Logout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
}
