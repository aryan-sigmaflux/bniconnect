"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Compass, Handshake } from "lucide-react";

const tabs = [
  {
    href: "/explore",
    label: "Explore",
    icon: <Compass size={22} />,
  },
  {
    href: "/likes",
    label: "1-2-1",
    icon: <Handshake size={22} />,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span className="bottom-nav-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
