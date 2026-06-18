import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getPendingFriendRequests, getFriendsLeaderboard } from "@lib/queries/social";
import { Avatar } from "@components/player/avatar";
import { FriendRequestCard } from "@components/social/friend-request-card";
import { PlayerSearchBar } from "@components/social/player-search-bar";
import { Suspense } from "react";

export default async function CrewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const currentPlayer = await getPlayerByUserId(session.user.id);
  if (!currentPlayer) redirect("/profile");

  const [pendingRequests, crew] = await Promise.all([
    getPendingFriendRequests(currentPlayer.id),
    getFriendsLeaderboard(currentPlayer.id),
  ]);

  const friends = crew.filter((p) => p.id !== currentPlayer.id);

  return (
    <div style={{ padding: "1.25rem" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "16px" }}>Amigos</h1>

      {/* Búsqueda */}
      <PlayerSearchBar currentPlayerId={currentPlayer.id} />

      {/* Solicitudes pendientes */}
      {pendingRequests.length > 0 && (
        <>
          <h2 style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", margin: "20px 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Solicitudes pendientes ({pendingRequests.length})
          </h2>
          {pendingRequests.map((req) => (
            <FriendRequestCard key={req.id} request={req} />
          ))}
        </>
      )}

      {/* Crew actual */}
      <h2 style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", margin: "20px 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Tus amigos ({friends.length})
      </h2>

      {friends.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "13px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>👥</div>
          <p>Aún no tienes amigos.</p>
          <p style={{ marginTop: "6px" }}>Busca jugadores por username para añadirlos.</p>
        </div>
      ) : (
        friends.map((player) => (
          <div key={player.id} className="card" style={{ padding: "12px 14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Avatar name={player.displayName} src={player.avatarUrl} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 500 }}>{player.displayName}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>@{player.username} · LV {player.level}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "16px", fontWeight: 500 }}>{player.elo}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>ELO</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
