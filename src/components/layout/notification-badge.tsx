import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";
import { getUnreadCount } from "@lib/queries/social";

export async function NotificationBadge() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const player = await getPlayerByUserId(session.user.id);
  if (!player) return null;

  const count = await getUnreadCount(player.id);
  if (count === 0) return null;

  return (
    <div style={{
      position:        "absolute",
      top:             -2,
      right:           -2,
      width:           16,
      height:          16,
      borderRadius:    "50%",
      background:      "var(--red)",
      color:           "#fff",
      fontSize:        "9px",
      fontWeight:      700,
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
    }}>
      {count > 9 ? "9+" : count}
    </div>
  );
}
