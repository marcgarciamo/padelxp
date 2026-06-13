import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { AppHeader } from "@components/layout/app-header";
import { BottomNav } from "@components/layout/bottom-nav";
import { SpeedDialFab } from "@components/layout/speed-dial-fab";
import { Toaster } from "sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/onboarding");

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
      
      <SpeedDialFab />
      
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
