"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, PlusCircle, Swords, User, LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  accent?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",               label: "Feed",     icon: Home },
  { href: "/rankings",       label: "Rankings", icon: Trophy },
  { href: "/register-match", label: "Nuevo",    icon: PlusCircle, accent: true },
  { href: "/matches",        label: "Partidos", icon: Swords },
  { href: "/profile",        label: "Perfil",   icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 50 }}>
      <nav style={{
        width:           "100%",
        maxWidth:        "480px",
        background:      "var(--bg-surface)",
        borderTop:       "1px solid var(--border)",
        display:         "flex",
        paddingBottom:   "env(safe-area-inset-bottom)",
      }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
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
              <Icon
                size={22}
                style={{
                  color: accent ? "var(--accent)" : undefined,
                  strokeWidth: isActive ? 2 : 1.5,
                }}
              />
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
      </nav>
    </div>
  );
}
