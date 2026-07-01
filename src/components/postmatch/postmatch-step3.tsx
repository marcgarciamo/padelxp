"use client";

import { useState, useTransition } from "react";
import { submitPrestigeVotes } from "@lib/actions/postmatch";
import { Avatar } from "@components/player/avatar";
import { toast } from "sonner";

const ATTRS = [
  { key: "ptsAttack",  attrKey: "attrAttack",  label: "DER", icon: "/icons/attrs/ataque.jpeg" },
  { key: "ptsDefense", attrKey: "attrDefense", label: "REV", icon: "/icons/attrs/defensa.jpeg" },
  { key: "ptsVolley",  attrKey: "attrVolley",  label: "VOL", icon: "/icons/attrs/volea.jpeg" },
  { key: "ptsBandeja", attrKey: "attrBandeja", label: "BAN", icon: null },
  { key: "ptsRemate",  attrKey: "attrRemate",  label: "REM", icon: "/icons/attrs/remate.jpeg" },
] as const;

const POOL = 3;

interface PlayerVote {
  targetId:   string;
  ptsAttack:  number;
  ptsDefense: number;
  ptsVolley:  number;
  ptsBandeja: number;
  ptsRemate:  number;
}

interface Props {
  flow:          any;
  currentPlayer: any;
  rivals:        any[];
  onNext:        (rewards: any) => void;
}

export function PostmatchStep3({ flow, currentPlayer, rivals, onNext }: Props) {
  const [votes, setVotes] = useState<PlayerVote[]>(
    rivals.map((r) => ({
      targetId: r.id,
      ptsAttack: 0, ptsDefense: 0, ptsVolley: 0, ptsBandeja: 0, ptsRemate: 0,
    }))
  );
  const [isPending, startTransition] = useTransition();

  function getTotal(vote: PlayerVote) {
    return vote.ptsAttack + vote.ptsDefense + vote.ptsVolley + vote.ptsBandeja + vote.ptsRemate;
  }

  function adjust(rivalIndex: number, attr: keyof Omit<PlayerVote, "targetId">, delta: number) {
    setVotes((prev) => prev.map((v, i) => {
      if (i !== rivalIndex) return v;
      const current = v[attr];
      const newVal  = current + delta;
      const total   = getTotal(v) + delta;
      if (newVal < 0 || total > POOL) return v;
      return { ...v, [attr]: newVal };
    }));
  }

  const allDone = votes.every((v) => getTotal(v) === POOL);

  function handleSubmit() {
    if (!allDone) { toast.error("Reparte exactamente 3 puntos a cada jugador"); return; }
    startTransition(async () => {
      const result = await submitPrestigeVotes({ flowId: flow.id, votes });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("¡Puntos de Prestigio enviados!");
      onNext({ prestigeVotes: votes });
    });
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>✨</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "6px" }}>Puntos de Prestigio</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Reparte 3 puntos entre los atributos de cada rival según su actuación
        </p>
      </div>

      {rivals.map((rival, ri) => {
        const vote  = votes[ri]!;
        const total = getTotal(vote);
        const left  = POOL - total;

        return (
          <div key={rival.id} className="card" style={{ padding: "16px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <Avatar name={rival.displayName} src={rival.avatarUrl} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{rival.displayName}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Media {Math.round((rival.attrAttack + rival.attrDefense + rival.attrVolley + rival.attrConsistency) / 4)}
                </div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background:  left > 0 ? "var(--accent)" : "var(--green)",
                display:     "flex", alignItems: "center", justifyContent: "center",
                fontSize:    "14px", fontWeight: 700, color: "#fff",
                transition:  "background 0.2s",
              }}>
                {left}
              </div>
            </div>

            {ATTRS.map(({ key, attrKey, label, icon }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                {icon ? (
                  <img src={icon} alt={label} style={{ width: 20, height: 20, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                ) : (
                  <span style={{ fontSize: "14px", color: "var(--text-muted)", width: "20px", textAlign: "center" }}>◆</span>
                )}
                <span style={{ fontSize: "12px", color: "var(--text-muted)", width: "28px", fontWeight: 500 }}>{label}</span>
                <button
                  onClick={() => adjust(ri, key, -1)}
                  disabled={vote[key] === 0}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)",
                    background: "var(--bg-elevated)", color: "var(--text-primary)",
                    fontSize: "16px", cursor: vote[key] > 0 ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: vote[key] === 0 ? 0.4 : 1,
                  }}
                >−</button>
                <div style={{
                  flex: 1, textAlign: "center", fontSize: "18px", fontWeight: 700,
                  color: vote[key] > 0 ? "var(--accent-light)" : "var(--text-muted)",
                }}>
                  {vote[key]}
                </div>
                <button
                  onClick={() => adjust(ri, key, 1)}
                  disabled={left === 0}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)",
                    background: left > 0 ? "var(--accent)" : "var(--bg-elevated)",
                    color: left > 0 ? "#fff" : "var(--text-muted)",
                    fontSize: "16px", cursor: left > 0 ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: left === 0 ? 0.4 : 1,
                  }}
                >+</button>

                <div style={{ width: "40px", height: "4px", background: "var(--bg-elevated)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width:  `${rival[attrKey] ?? 50}%`,
                    background: "var(--accent)",
                    borderRadius: "2px",
                  }} />
                </div>
              </div>
            ))}

            {total === POOL && (
              <div style={{ textAlign: "center", fontSize: "11px", color: "var(--green)", marginTop: "6px" }}>
                ✓ Puntos repartidos
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={handleSubmit}
        disabled={isPending || !allDone}
        style={{
          width: "100%", padding: "14px", borderRadius: "12px", border: "none",
          background:  allDone ? "linear-gradient(135deg, var(--accent), #a78bfa)" : "var(--bg-elevated)",
          color:       allDone ? "#fff" : "var(--text-muted)",
          fontSize:    "14px", fontWeight: 700, cursor: allDone ? "pointer" : "not-allowed",
        }}
      >
        {isPending ? "Enviando..." : "Finalizar Partido 🚀"}
      </button>

      {!allDone && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "8px" }}>
          Reparte los {POOL} puntos a cada jugador para continuar
        </p>
      )}
    </div>
  );
}
