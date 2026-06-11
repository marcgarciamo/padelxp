"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, Trophy, Medal, Users, Bell } from "lucide-react";
import { type NavItem } from "./bottom-nav";

const ICON_MAP = {
  home:   Home,
  trophy: Trophy,
  medal:  Medal,
  users:  Users,
  bell:   Bell,
};

interface Props {
  items:    NavItem[];
  children?: React.ReactNode; // El badge
}

export function BottomNavClient({ items, children }: Props) {
  const pathname = usePathname();

  return (
    <>
      {items.map(({ href, label, icon, accent, badge }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const Icon = ICON_MAP[icon];
        return (
          <Link
            key={href}
            href={href}
            style={{
              position:       "relative",
              flex:           1,
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              gap:            "3px",
              padding:        "10px 4px 8px",
              textDecoration: "none",
              color: accent
                ? "var(--accent)"
                : isActive
                  ? "var(--accent)"
                  : "var(--text-muted)",
              fontSize: "10px",
              transition: "color 0.15s",
            }}
          >
            <div style={{ position: "relative" }}>
              <Icon
                size={22}
                style={{
                  color: accent ? "var(--accent)" : undefined,
                  strokeWidth: isActive ? 2 : 1.5,
                }}
              />
              {badge && children}
            </div>
            {label}
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                style={{
                  width:        24,
                  height:       2,
                  background:   "var(--accent)",
                  borderRadius: 1,
                  position:     "absolute",
                  bottom:       6,
                }}
              />
            )}
          </Link>
        );
      })}
    </>
  );
}
