"use client";

import { useTransition } from "react";
import { toggleReaction } from "@lib/actions/social";

const EMOJIS = ["🔥", "👏", "😮", "💪", "🎾"];

interface ReactionCount { emoji: string; count: number; reacted: boolean; }

interface Props {
  matchId:          string;
  reactions:        any[];
  currentPlayerId?: string | undefined;
}

export function MatchReactions({ matchId, reactions, currentPlayerId }: Props) {
  const [isPending, startTransition] = useTransition();

  const counts = EMOJIS.map((emoji) => {
    const filtered = reactions.filter((r) => r.emoji === emoji);
    return {
      emoji,
      count:   filtered.length,
      reacted: filtered.some((r) => r.playerId === currentPlayerId),
    };
  }).filter((r) => r.count > 0 || true); // mostrar todos

  function handleToggle(emoji: string) {
    startTransition(() => toggleReaction(matchId, emoji));
  }

  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
      {counts.map(({ emoji, count, reacted }) => (
        <button
          key={emoji}
          onClick={() => handleToggle(emoji)}
          disabled={isPending}
          style={{
            background:   reacted ? "rgba(124,92,252,0.2)" : "var(--bg-elevated)",
            border:       reacted ? "1px solid rgba(124,92,252,0.4)" : "1px solid var(--border)",
            borderRadius: "20px",
            padding:      "4px 10px",
            fontSize:     "13px",
            cursor:       "pointer",
            color:        "var(--text-primary)",
            display:      "flex",
            alignItems:   "center",
            gap:          "4px",
          }}
        >
          {emoji} {count > 0 && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{count}</span>}
        </button>
      ))}
    </div>
  );
}
