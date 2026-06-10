import { AppHeader } from "@components/layout/app-header";
import { BottomNav } from "@components/layout/bottom-nav";
import { Toaster } from "sonner";

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
