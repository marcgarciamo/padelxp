"use client";

import { useTransition } from "react";
import { acceptFriendRequest, rejectFriendRequest } from "@lib/actions/social";
import { Avatar } from "@components/player/avatar";
import { toast } from "sonner";

interface Props { request: any; }

export function FriendRequestCard({ request }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      try {
        await acceptFriendRequest(request.id);
        toast.success(`¡Ahora sois amigos con ${request.requester.displayName}! 🤝`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al aceptar");
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectFriendRequest(request.id);
        toast.info("Solicitud rechazada");
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
        borderLeft:   "3px solid var(--accent)",
      }}
    >
      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <Avatar
          name={request.requester.displayName}
          src={request.requester.avatarUrl}
          size={32}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 500 }}>
            {request.requester.displayName}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Quiere añadirte a su crew
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{
        background:   "var(--bg-elevated)",
        borderRadius: "8px",
        padding:      "8px 12px",
        marginBottom: "12px",
        fontSize:     "11px",
        color:        "var(--text-muted)",
      }}>
        {request.requester.elo} ELO · LV {request.requester.level}
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
