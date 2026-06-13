"use client";

import { useTransition } from "react";
import { acceptTournamentInvitation, rejectTournamentInvitation } from "@lib/actions/social";
import { Avatar } from "@components/player/avatar";
import { toast } from "sonner";

interface Props { invitation: any; }

export function TournamentInvitationCard({ invitation }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      try {
        await acceptTournamentInvitation(invitation.id);
        toast.success(`Te has unido al torneo "${invitation.tournament.name}" 🏆`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al aceptar");
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectTournamentInvitation(invitation.id);
        toast.info("Invitación rechazada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al rechazar");
      }
    });
  }

  return (
    <div
      className="card"
      style={{
        padding:      "14px",
        marginBottom: "8px",
        borderLeft:   "3px solid var(--gold)",
      }}
    >
      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{ fontSize: "22px" }}>🏆</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 500 }}>
            Invitación al torneo
          </div>
          <div style={{ fontSize: "12px", color: "var(--gold)", fontWeight: 500 }}>
            {invitation.tournament.name}
          </div>
        </div>
        <span style={{
          fontSize:     "10px",
          background:   "rgba(245,158,11,0.1)",
          color:        "var(--gold)",
          border:       "1px solid rgba(245,158,11,0.3)",
          borderRadius: "20px",
          padding:      "2px 8px",
        }}>
          Pendiente
        </span>
      </div>

      {/* Invitador */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <Avatar
          name={invitation.inviter.displayName}
          src={invitation.inviter.avatarUrl}
          size={28}
        />
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            {invitation.inviter.displayName}
          </span>
          {" "}quiere jugar contigo como pareja
        </div>
      </div>

      {/* Info torneo */}
      <div style={{
        background:   "var(--bg-elevated)",
        borderRadius: "8px",
        padding:      "8px 12px",
        marginBottom: "12px",
        fontSize:     "12px",
        color:        "var(--text-muted)",
        display:      "flex",
        gap:          "16px",
      }}>
        <span>🏅 {invitation.tournament.xpReward} XP</span>
        <span>👥 {invitation.tournament.format === "elimination" ? "Eliminatoria" : "Liga"}</span>
      </div>

      {/* Botones */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleAccept}
          disabled={isPending}
          style={{
            flex:         1,
            background:   "var(--accent)",
            color:        "#fff",
            border:       "none",
            borderRadius: "10px",
            padding:      "10px",
            fontSize:     "13px",
            fontWeight:   500,
            cursor:       "pointer",
          }}
        >
          {isPending ? "..." : "✓ Aceptar"}
        </button>
        <button
          onClick={handleReject}
          disabled={isPending}
          style={{
            flex:         1,
            background:   "var(--bg-elevated)",
            color:        "var(--text-muted)",
            border:       "1px solid var(--border)",
            borderRadius: "10px",
            padding:      "10px",
            fontSize:     "13px",
            fontWeight:   500,
            cursor:       "pointer",
          }}
        >
          {isPending ? "..." : "✗ Rechazar"}
        </button>
      </div>
    </div>
  );
}
