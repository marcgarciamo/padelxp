"use client";

import { useTransition } from "react";
import { Avatar } from "@components/player/avatar";
import { acceptChallenge, rejectChallenge } from "@lib/actions/challenges";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Challenge } from "@db/schema";

interface Props {
  challenge: Challenge & { challenger: any; challenged: any };
  currentPlayerId: string;
}

export function ChallengeCard({ challenge, currentPlayerId }: Props) {
  const [isPending, startTransition] = useTransition();

  const isChallenger = challenge.challengerId === currentPlayerId;
  const otherPlayer  = isChallenger ? challenge.challenged : challenge.challenger;
  
  const isPendingReceived = challenge.status === "pending" && !isChallenger;

  function handleAccept() {
    startTransition(async () => {
      await acceptChallenge(challenge.id);
      toast.success("Reto aceptado");
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectChallenge(challenge.id);
      toast.info("Reto rechazado");
    });
  }

  return (
    <div className="card" style={{ padding: "12px 14px", marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Avatar name={otherPlayer.displayName} src={otherPlayer.avatarUrl} size={36} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 500 }}>
              {isChallenger ? `Retaste a ${otherPlayer.displayName}` : `${otherPlayer.displayName} te retó`}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Hace {formatDistanceToNow(new Date(challenge.createdAt), { locale: es })}
            </div>
          </div>
        </div>
        <span className="badge-xp" style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px" }}>
          ⚔️ {challenge.xpStake} XP
        </span>
      </div>

      {challenge.message && (
        <div style={{ background: "var(--bg-primary)", padding: "8px", borderRadius: "6px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
          "{challenge.message}"
        </div>
      )}

      {isPendingReceived && (
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button
            onClick={handleAccept}
            disabled={isPending}
            style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none", padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
          >
            Aceptar
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            style={{ flex: 1, background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
          >
            Rechazar
          </button>
        </div>
      )}

      {challenge.status === "accepted" && (
        <div style={{ fontSize: "12px", color: "var(--green)", textAlign: "center", marginTop: "8px", fontWeight: 500 }}>
          ✓ Reto activo (Esperando resultado)
        </div>
      )}
      
      {challenge.status === "rejected" && (
        <div style={{ fontSize: "12px", color: "var(--red)", textAlign: "center", marginTop: "8px", fontWeight: 500 }}>
          ✗ Reto rechazado
        </div>
      )}
    </div>
  );
}
