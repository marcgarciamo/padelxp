import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { getNotifications } from "@lib/queries/social";
import { markAllNotificationsRead } from "@lib/actions/social";
import { Avatar } from "@components/player/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const NOTIFICATION_ICONS: Record<string, string> = {
  friend_request:   "👋",
  friend_accepted:  "🤝",
  match_reaction:   "🎾",
  match_registered: "📋",
  level_up:         "⬆️",
  achievement:      "🏆",
};

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/profile");

  const notifs = await getNotifications(player.id, 30);

  // Marcar todas como leídas
  await markAllNotificationsRead(player.id);

  return (
    <div style={{ padding: "1.25rem" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "16px" }}>Notificaciones</h1>

      {notifs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "13px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔔</div>
          <p>No tienes notificaciones.</p>
        </div>
      ) : (
        notifs.map((n) => (
          <div
            key={n.id}
            className="card"
            style={{
              padding:      "12px 14px",
              marginBottom: "8px",
              display:      "flex",
              alignItems:   "center",
              gap:          "12px",
              opacity:      n.read ? 0.7 : 1,
              borderLeft:   n.read ? undefined : "3px solid var(--accent)",
            }}
          >
            <div style={{ fontSize: "24px", flexShrink: 0 }}>
              {NOTIFICATION_ICONS[n.type] ?? "🔔"}
            </div>
            {n.fromPlayer && <Avatar name={n.fromPlayer.displayName} size={32} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px" }}>{n.message}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
