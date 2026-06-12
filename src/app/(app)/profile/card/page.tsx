import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import { ShareCardButton } from "@components/player/share-card-button";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatPosition(position: "left" | "right" | "both" | null) {
  if (position === "left") return "Reves";
  if (position === "right") return "Drive";
  return "Ambos lados";
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "14px", padding: "12px" }}>
      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Attribute({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "5px" }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", background: color, borderRadius: "999px" }} />
      </div>
    </div>
  );
}

export default async function PlayerCardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/profile");

  const totalMatches = player.totalWins + player.totalLosses;
  const winRate = totalMatches > 0 ? Math.round((player.totalWins / totalMatches) * 100) : 0;
  const xpProgress = Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100));
  const initials = getInitials(player.displayName || player.username) || "PX";
  const position = formatPosition(player.position);
  const ovr = player.elo;

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "24px", width: "100%", textAlign: "left" }}>Tu Player Card</h1>

      <div
        style={{
          width: "100%",
          maxWidth: "320px",
          aspectRatio: "2/3",
          marginBottom: "24px",
          filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))",
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.35), transparent 32%), linear-gradient(180deg, #f7d774 0%, #d6a84f 24%, #8c6a1f 100%)",
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          color: "#1f1402",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "11px", color: "rgba(31,20,2,0.75)", letterSpacing: "0.18em", fontWeight: 700 }}>PADELXP</div>
            <div style={{ fontSize: "28px", fontWeight: 900, lineHeight: 1 }}>{position}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: "11px", color: "rgba(31,20,2,0.75)", fontWeight: 700, letterSpacing: "0.12em" }}>OVR</div>
            <div style={{ fontSize: "46px", fontWeight: 900, lineHeight: 0.95 }}>{ovr}</div>
            <div style={{ fontSize: "11px", color: "rgba(31,20,2,0.7)", marginTop: "2px" }}>LV {player.level}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "26px" }}>
          <div style={{ width: "118px", height: "118px", borderRadius: "999px", background: "rgba(255,255,255,0.2)", border: "4px solid rgba(31,20,2,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "38px", fontWeight: 900, color: "#1f1402", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.2)" }}>
            {initials}
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, marginTop: "14px", textAlign: "center", lineHeight: 1.05 }}>{player.displayName}</div>
          <div style={{ fontSize: "12px", color: "rgba(31,20,2,0.75)", marginTop: "5px", fontWeight: 700 }}>@{player.username}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "18px" }}>
          <Stat label="ELO" value={ovr} />
          <Stat label="Posicion" value={formatPosition(player.position)} />
          <Stat label="Victorias" value={player.totalWins} />
          <Stat label="Win rate" value={`${winRate}%`} />
        </div>

        <div style={{ marginTop: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#cbd5e1", marginBottom: "7px" }}>
              <span>XP</span>
              <span>{player.xp} / {player.xpToNextLevel}</span>
            </div>
            <div style={{ height: "9px", background: "#1f2937", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ width: `${xpProgress}%`, height: "100%", background: "#2dd4bf", borderRadius: "999px" }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginTop: "auto" }}>
          <Attribute label="Ataque" value={player.attrAttack} color="#8b5cf6" />
          <Attribute label="Defensa" value={player.attrDefense} color="#06b6d4" />
          <Attribute label="Volea" value={player.attrVolley} color="#f97316" />
          <Attribute label="Control" value={player.attrConsistency} color="#16a34a" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", color: "rgba(31,20,2,0.8)", fontSize: "11px", fontWeight: 700 }}>
          <span>{player.achievements.length} logros</span>
          <span>{totalMatches} partidos</span>
        </div>
      </div>

      <div style={{ width: "100%" }}>
        <ShareCardButton playerId={player.id} playerName={player.displayName} />
      </div>

      <p style={{ marginTop: "16px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
        Las estadisticas evolucionan con tu progreso.
      </p>
    </div>
  );
}
