import { AppHeader } from "@components/layout/app-header";
import { BottomNav } from "@components/layout/bottom-nav";
import { Toaster } from "sonner";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <AppHeader title="PadelXP" subtitle="Season 4" />
      <main style={{
        paddingBottom: "calc(60px + env(safe-area-inset-bottom))",
        maxWidth:      "480px",
        margin:        "0 auto",
        width:         "100%",
      }}>
        {children}
      </main>
      
      <Link
        href="/register-match"
        style={{
          position:       "fixed",
          bottom:         "calc(70px + env(safe-area-inset-bottom))",
          right:          "max(16px, calc(50% - 224px))",
          width:          "52px",
          height:         "52px",
          borderRadius:   "50%",
          background:     "var(--accent)",
          color:          "#fff",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       "24px",
          boxShadow:      "0 4px 20px rgba(124,92,252,0.4)",
          textDecoration: "none",
          zIndex:         45,
        }}
      >
        +
      </Link>
      
      <BottomNav />
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "var(--bg-elevated)",
            border:     "1px solid var(--border)",
            color:      "var(--text-primary)",
          },
        }}
      />
    </div>
  );
}
