import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerByUserId } from "@lib/queries/players";
import PlayerCardFlip from "@components/player/player-card-flip";
import BackgroundParticles from "@components/ui/background-particles";
import { ShareButton, DownloadButton, CopyLinkButton } from "@components/profile/card-actions";

export default async function ProfileCardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.user.id);
  if (!player) redirect("/profile");

  const cardUrl = `/api/og?id=${player.id}`;

  return (
    <div
      style={{
        minHeight: "calc(100dvh - 120px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        position: "relative",
        background:
          "radial-gradient(ellipse at 50% 40%, rgba(13,33,55,0.95) 0%, rgba(10,22,40,0.98) 50%, transparent 100%)",
        overflow: "hidden",
      }}
    >
      <BackgroundParticles />

      {/* Anillos de luz */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(57,255,20,0.06) 0%, rgba(0,212,255,0.04) 40%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(20px)",
        }}
      />

      {/* Título */}
      <p
        style={{
          fontSize: "11px",
          color: "rgba(0,212,255,0.6)",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          marginBottom: "24px",
          fontFamily: "Arial, sans-serif",
          zIndex: 1,
        }}
      >
        Tu carta de jugador
      </p>

      {/* Carta con flip */}
      <div style={{ zIndex: 1 }}>
        <PlayerCardFlip player={player} size="md" autoFlip={true} />
      </div>

      {/* Botones de acción */}
      <div
        style={{
          marginTop: "28px",
          width: "100%",
          maxWidth: "300px",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <ShareButton cardUrl={cardUrl} playerName={player.displayName} />
          <DownloadButton cardUrl={cardUrl} playerName={player.displayName} />
          <CopyLinkButton cardUrl={cardUrl} />
        </div>
      </div>

      {/* Stats rápidas */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          marginTop: "20px",
          zIndex: 1,
        }}
      >
        {[
          { val: player.elo, lbl: "ELO" },
          { val: `LV${player.level}`, lbl: "Nivel" },
          { val: player.totalWins, lbl: "Victorias" },
        ].map((s) => (
          <div key={s.lbl} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#39ff14",
              }}
            >
              {s.val}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "rgba(148,163,184,0.6)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {s.lbl}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
