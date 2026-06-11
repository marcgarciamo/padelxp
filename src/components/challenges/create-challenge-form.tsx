"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { sendChallenge } from "@lib/actions/challenges";
import { toast } from "sonner";
import { type Player } from "@db/schema";

interface Props {
  currentPlayer: Player;
}

export function CreateChallengeForm({ currentPlayer }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetPlayerId, setTargetPlayerId] = useState("");
  const [xpStake, setXpStake] = useState(100);
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetPlayerId) return toast.error("Ingresa el ID del jugador a retar");

    if (xpStake > currentPlayer.xp) {
      return toast.error("No tienes suficiente XP para esta apuesta");
    }

    startTransition(async () => {
      try {
        await sendChallenge(targetPlayerId, xpStake, message);
        toast.success("¡Reto enviado con éxito!");
        router.push("/challenges");
      } catch (error: any) {
        toast.error(error.message || "Error al enviar el reto");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label htmlFor="targetPlayerId">Oponente (ID del jugador)</Label>
        <Input
          id="targetPlayerId"
          required
          value={targetPlayerId}
          onChange={(e) => setTargetPlayerId(e.target.value)}
          placeholder="Ej: f47ac10b-58cc..."
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>*Puedes copiar su ID desde su perfil</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label htmlFor="xpStake">Apuesta de XP</Label>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Input
            id="xpStake"
            type="number"
            required
            min={50}
            max={currentPlayer.xp}
            value={xpStake}
            onChange={(e) => setXpStake(Number(e.target.value))}
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", flex: 1 }}
          />
          <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Max: {currentPlayer.xp} XP
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label htmlFor="message">Mensaje provocador (Opcional)</Label>
        <Input
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="¡Prepárate para perder!"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="btn-primary"
        style={{ border: "none", marginTop: "0.5rem" }}
      >
        {isPending ? "Enviando reto..." : "⚔️ Lanzar Reto"}
      </Button>
    </form>
  );
}
