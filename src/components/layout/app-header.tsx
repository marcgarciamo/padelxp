"use client";

import { signOut, useSession } from "@lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AppHeaderProps {
  title:    string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === "/";

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
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {!isHome ? (
          <button 
            onClick={() => router.back()} 
            style={{ 
              background: "none", border: "none", cursor: "pointer", 
              color: "var(--text-primary)", display: "flex", alignItems: "center",
              padding: "4px"
            }}
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }}></span>
        )}
        
        <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/icons/attrs/logo.png" alt="PadelXP" style={{ height: "28px", width: "auto", display: "block" }} />
          {subtitle && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "2px 8px", borderRadius: "20px" }}>
              {subtitle}
            </span>
          )}
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {session?.user && (
          <Link href="/profile" style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>
            {session.user.name}
          </Link>
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
