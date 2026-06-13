import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId, getLeaderboard } from "@lib/queries/players";
import { OnboardingFlow } from "@components/onboarding/onboarding-flow";
import { Toaster } from "sonner";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (player) redirect("/");

  const allPlayers = await getLeaderboard(50);

  return (
    <div style={{
      minHeight:      "100dvh",
      background:     "var(--bg-primary)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
    }}>
      <OnboardingFlow
        userName={session.user.name ?? ""}
        availablePlayers={allPlayers}
      />
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
