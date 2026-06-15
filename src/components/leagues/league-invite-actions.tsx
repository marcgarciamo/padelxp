"use client";

import { useTransition } from "react";
import { acceptLeagueInvite, rejectLeagueInvite, cancelLeagueInvite } from "@lib/actions/leagues";
import { Avatar } from "@components/player/avatar";
import { toast } from "sonner";
import type { Player } from "@db/schema";

interface InviteWithPlayers {
  id:        string;
  status:    string;
  inviterId: string;
  inviteeId: string;
  inviter:   Player;
  invitee:   Player;
}

interface Props {
  invite:          InviteWithPlayers;
  currentPlayerId: string;
}

export function LeagueInviteActions({ invite, currentPlayerId }: Props) {
  const [isPending, startTransition] = useTransition();

  const isInvitee = invite.inviteeId === currentPlayerId;
  const isInviter = invite.inviterId === currentPlayerId;

  function handleAccept() {
    startTransition(async () => {
      try {
        await acceptLeagueInvite(invite.id);
        toast.success("¡Te has unido a la liga!");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al aceptar");
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectLeagueInvite(invite.id);
        toast.success("Invitación rechazada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al rechazar");
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      try {
        await cancelLeagueInvite(invite.id);
        toast.success("Invitación cancelada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al cancelar");
      }
    });
  }

  if (isInvitee) {
    return (
      <div className="card" style={{ padding: "16px", border: "1px solid rgba(124,92,252,0.3)" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>Invitación recibida</div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <Avatar name={invite.inviter.displayName} src={invite.inviter.avatarUrl} size={36} />
          <div>
            <div style={{ fontSize: "13px", fontWeight: 500 }}>{invite.inviter.displayName}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>te invita a jugar juntos</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleReject}
            disabled={isPending}
            style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}
          >
            Rechazar
          </button>
          <button
            onClick={handleAccept}
            disabled={isPending}
            style={{ flex: 2, background: "var(--accent)", color: "#fff", border: "none", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
          >
            {isPending ? "Procesando..." : "Aceptar invitación"}
          </button>
        </div>
      </div>
    );
  }

  if (isInviter) {
    return (
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>Invitación enviada</div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <Avatar name={invite.invitee.displayName} src={invite.invitee.avatarUrl} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 500 }}>{invite.invitee.displayName}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>pendiente de respuesta</div>
          </div>
          <span style={{ fontSize: "20px" }}>⏳</span>
        </div>
        <button
          onClick={handleCancel}
          disabled={isPending}
          style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}
        >
          {isPending ? "Cancelando..." : "Cancelar invitación"}
        </button>
      </div>
    );
  }

  return null;
}
