import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar } from "@components/player/avatar";
import type { Match, Player } from "@db/schema";

interface MatchWithPlayers extends Match {
  team1Player1: Player;
  team1Player2: Player;
  team2Player1: Player;
  team2Player2: Player;
}

interface MatchCardProps {
  match:          MatchWithPlayers;
  currentPlayerId: string | undefined;
}

export function MatchCard({ match, currentPlayerId }: MatchCardProps) {
  const isTeam1 = currentPlayerId
    ? [match.team1Player1Id, match.team1Player2Id].includes(currentPlayerId)
    : true;
  const won = isTeam1
    ? match.winnerTeam === "team1"
    : match.winnerTeam === "team2";
  const xpGained = isTeam1 ? match.team1XpGained : match.team2XpGained;
  const sets = match.sets as Array<{ team1: number; team2: number }>;

  return (
    <div className="card" style={{ padding: "14px", marginBottom: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>📍 {match.venue}</span>
        <span className={`badge-${won ? "win" : "loss"}`} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>
          {won ? "Victoria" : "Derrota"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Avatar name={match.team1Player1.displayName} size={24} />
          <Avatar name={match.team1Player2.displayName} size={24} />
          <span style={{ fontSize: "12px", fontWeight: 500 }}>
            {match.team1Player1.displayName.split(" ")[0]} & {match.team1Player2.displayName.split(" ")[0]}
          </span>
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>vs</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 500 }}>
            {match.team2Player1.displayName.split(" ")[0]} & {match.team2Player2.displayName.split(" ")[0]}
          </span>
          <Avatar name={match.team2Player1.displayName} size={24} />
          <Avatar name={match.team2Player2.displayName} size={24} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
        {sets.map((s, i) => (
          <span key={i} style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
            {s.team1}–{s.team2}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {formatDistanceToNow(new Date(match.playedAt), { addSuffix: true, locale: es })}
        </span>
        <span className="badge-xp" style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "20px" }}>
          +{xpGained} XP
        </span>
      </div>
    </div>
  );
}
