import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getNotifications, getPendingTournamentInvitations, getPendingFriendRequests } from "@lib/queries/social";
import { getPendingFlowsByPlayer } from "@lib/queries/matches";
import { Avatar } from "@components/player/avatar";
import { db } from "@db/index";
import { notifications as notificationsTable } from "@db/schema";
import { eq } from "drizzle-orm";
import { TournamentInvitationCard } from "@components/notifications/tournament-invitation-card";
import { FriendRequestCard } from "@components/social/friend-request-card";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const NOTIFICATION_ICONS: Record<string, string> = {
  friend_request:   "👋",
  friend_accepted:  "🤝",
  match_reaction:   "🎾",
  match_registered: "🏆",
  tournament_invite: "🏆",
  league_invite:     "🎾",
  level_up:         "⬆️",
  achievement:      "🏅",
};

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/profile");

  const [notifs, friendRequests, pendingFlows] = await Promise.all([
    getNotifications(player.id, 30),
    getPendingFriendRequests(player.id),
    getPendingFlowsByPlayer(player.id),
  ]);

  // Set invertida: flowId → true para lookup rápido
  const pendingFlowIds = new Set(pendingFlows.values());

  let tournamentInvitations: any[] = [];
  try {
    tournamentInvitations = await getPendingTournamentInvitations(player.id);
  } catch (error) {
    console.error("Error fetching tournament invitations:", error);
  }

  // Marcar todas como leídas directamente (sin Server Action para evitar revalidatePath durante render)
  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.playerId, player.id));

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
                {n.flowId && pendingFlowIds.has(n.flowId) && (
                  <a
                    href={`/postmatch/${n.flowId}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      marginTop: "8px", padding: "8px", borderRadius: "10px",
                      background: "rgba(124,92,252,0.12)", border: "1px solid var(--accent)",
                      color: "var(--accent-light)", fontSize: "12px", fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    ⏳ Pendiente — Continuar votación →
                  </a>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
