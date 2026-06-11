import { BottomNavClient } from "./bottom-nav-client";
import { NotificationBadge } from "./notification-badge";

export interface NavItem {
  href:   string;
  label:  string;
  icon:   "home" | "trophy" | "medal" | "users" | "bell";
  accent?: boolean;
  badge?:  boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",               label: "Feed",     icon: "home" },
  { href: "/rankings",       label: "Ranks",    icon: "trophy" },
  { href: "/tournaments",    label: "Torneos",  icon: "medal" },
  { href: "/crew",           label: "Crew",     icon: "users" },
  { href: "/notifications",  label: "Notif",    icon: "bell", badge: true },
];

export function BottomNav() {
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
        <BottomNavClient items={NAV_ITEMS}>
          <NotificationBadge />
        </BottomNavClient>
      </nav>
    </div>
  );
}
