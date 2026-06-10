import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getLeaderboard } from "@lib/queries/players";
import { getPlayerByUserId } from "@lib/queries/players";
import { Avatar } from "@components/player/avatar";
import { redirect } from "next/navigation";

export default async function RankingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [leaderboard, currentPlayer] = await Promise.all([
    getLeaderboard(50),
    getPlayerByUserId(session.user.id),
  ]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ padding: "1.25rem" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "16px" }}>Rankings</h1>

      {leaderboard.map((player, i) => {
        const isCurrentPlayer = player.id === currentPlayer?.id;
        return (
          <div
            key={player.id}
            className="card"
            style={{
              padding:      "12px 14px",
              marginBottom: "8px",
              display:      "flex",
              alignItems:   "center",
              gap:          "12px",
              borderLeft:   isCurrentPlayer ? "3px solid var(--accent)" : undefined,
              background:   isCurrentPlayer ? "var(--bg-elevated)" : undefined,
            }}
          >
            <div style={{ fontSize: i < 3 ? "20px" : "16px", width: "28px", textAlign: "center", color: "var(--text-muted)", fontWeight: 500 }}>
              {i < 3 ? medals[i] : i + 1}
            </div>
            <Avatar name={player.displayName} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 500 }}>{player.displayName}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Nivel {player.level} · {player.totalWins}V {player.totalLosses}D</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: 500 }}>{player.elo}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>ELO</div>
            </div>
          </div>
        );
      })}

      {leaderboard.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem", fontSize: "14px" }}>
          Aún no hay jugadores en el ranking.
        </div>
      )}
    </div>
  );
}
