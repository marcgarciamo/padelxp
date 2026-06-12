"use client";

import { useTransition } from "react";
import { Avatar } from "@components/player/avatar";
import { acceptFriendRequest, rejectFriendRequest } from "@lib/actions/social";
import { toast } from "sonner";

interface Props { request: any; }

export function FriendRequestCard({ request }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      await acceptFriendRequest(request.id);
      toast.success(`${request.requester.displayName} añadido a amigos`);
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectFriendRequest(request.id);
      toast.info("Solicitud rechazada");
    });
  }

  return (
    <div className="card" style={{ padding: "12px 14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
      <Avatar name={request.requester.displayName} src={request.requester.avatarUrl} playerId={request.requester.id} size={40} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 500 }}>{request.requester.displayName}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>@{request.requester.username}</div>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          onClick={handleAccept}
          disabled={isPending}
          style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", cursor: "pointer" }}
        >
          Aceptar
        </button>
        <button
          onClick={handleReject}
          disabled={isPending}
          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", cursor: "pointer" }}
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
