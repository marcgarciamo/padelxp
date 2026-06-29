import { db } from "@db/index";
import { players } from "@db/schema";
import { desc } from "drizzle-orm";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const allPlayers = await db.query.players.findMany({
    orderBy: [desc(players.elo)],
    columns: {
      id: true, displayName: true, username: true, avatarUrl: true,
      level: true, xp: true, elo: true, totalWins: true, totalLosses: true,
      role: true, banned: true, createdAt: true, mvpCount: true,
      attrAttack: true, attrDefense: true, attrVolley: true,
      attrConsistency: true, attrBandeja: true, attrRemate: true,
    },
  });

  return <UsersClient players={allPlayers} />;
}
