import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getPlayerByUserId } from "@lib/queries/players";
import { getUnreadCount, getPendingFriendRequests, getPendingTournamentInvitations } from "@lib/queries/social";

export async function NotificationBadge() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;

    const player = await getPlayerByUserId(session.user.id);
    if (!player) return null;

    const [unread, friendReqs, tournamentInvs] = await Promise.all([
      getUnreadCount(player.id),
      getPendingFriendRequests(player.id),
      getPendingTournamentInvitations(player.id),
    ]);

    const total = unread + friendReqs.length + tournamentInvs.length;
    if (total === 0) return null;

    return (
      <div style={{
        position:        "absolute",
        top:             "-2px",
        right:           "-2px",
        minWidth:        "16px",
        height:          "16px",
        borderRadius:    "8px",
        background:      "var(--red)",
        color:           "#fff",
        fontSize:        "9px",
        fontWeight:      700,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "0 3px",
        lineHeight:      1,
      }}>
        {total > 9 ? "9+" : total}
      </div>
    );
  } catch {
    return null;
  }
}
