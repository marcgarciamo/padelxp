"use client";

import { signOut, useSession } from "@lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface AppHeaderProps {
  title:    string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header style={{
      position:     "sticky",
      top:          0,
      background:   "var(--bg-surface)",
      borderBottom: "1px solid var(--border)",
      padding:      "12px 16px",
      display:      "flex",
      alignItems:   "center",
      justifyContent: "space-between",
      zIndex:       40,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }}></span>
        <span style={{ fontSize: "14px", fontWeight: 500 }}>PadelXP</span>
        {subtitle && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "2px 8px", borderRadius: "20px" }}>
            {subtitle}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {session?.user && (
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {session.user.name}
          </span>
        )}
        <button
          onClick={handleSignOut}
          aria-label="Cerrar sesión"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
