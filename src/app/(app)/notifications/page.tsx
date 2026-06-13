import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getNotifications, getPendingTournamentInvitations, getPendingFriendRequests } from "@lib/queries/social";
import { markAllNotificationsRead } from "@lib/actions/social";
import { Avatar } from "@components/player/avatar";
import { TournamentInvitationCard } from "@components/notifications/tournament-invitation-card";
import { FriendRequestCard } from "@components/social/friend-request-card";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const NOTIFICATION_ICONS: Record<string, string> = {
  friend_request:   "👋",
  friend_accepted:  "🤝",
  match_reaction:   "🎾",
  match_registered: "🏆",
  level_up:         "⬆️",
  achievement:      "🏅",
};

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/profile");

  const [notifs, tournamentInvitations, friendRequests] = await Promise.all([
    getNotifications(player.id, 30),
    getPendingTournamentInvitations(player.id),
    getPendingFriendRequests(player.id),
  ]);

  // Marcar todas como leídas al entrar
  await markAllNotificationsRead(player.id);

  const hasAnything = notifs.length > 0 || tournamentInvitations.length > 0 || friendRequests.length > 0;

  return (
    <div style={{ padding: "1.25rem" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "16px" }}>Notificaciones</h1>

      {!hasAnything && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "13px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔔</div>
          <p>No tienes notificaciones.</p>
        </div>
      )}

      {/* Invitaciones de torneo pendientes — acción requerida */}
      {tournamentInvitations.length > 0 && (
        <>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            Invitaciones a torneos ({tournamentInvitations.length})
          </div>
          {tournamentInvitations.map((inv) => (
            <TournamentInvitationCard key={inv.id} invitation={inv} />
          ))}
        </>
      )}

      {/* Solicitudes de amistad pendientes */}
      {friendRequests.length > 0 && (
        <>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "16px 0 8px" }}>
            Solicitudes de crew ({friendRequests.length})
          </div>
          {friendRequests.map((req) => (
            <FriendRequestCard key={req.id} request={req} />
          ))}
        </>
      )}

      {/* Historial de notificaciones */}
      {notifs.length > 0 && (
        <>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "16px 0 8px" }}>
            Actividad reciente
          </div>
          {notifs.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                padding:      "12px 14px",
                marginBottom: "8px",
                display:      "flex",
                alignItems:   "center",
                gap:          "12px",
                opacity:      n.read ? 0.65 : 1,
                borderLeft:   n.read ? undefined : "3px solid var(--accent)",
              }}
            >
              <div style={{ fontSize: "22px", flexShrink: 0 }}>
                {NOTIFICATION_ICONS[n.type] ?? "🔔"}
              </div>
              {n.fromPlayer && (
                <Avatar
                  name={n.fromPlayer.displayName}
                  src={n.fromPlayer.avatarUrl}
                  size={32}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
