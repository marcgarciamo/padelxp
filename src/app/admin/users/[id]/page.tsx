import { db } from "@db/index";
import { players, matches, seasonSnapshots } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const player = await db.query.players.findFirst({ where: eq(players.id, id) });
  if (!player) notFound();

  const [recentMatches, snapshots] = await Promise.all([
    db.query.matches.findMany({
      where: (m, { or }) => or(
        eq(m.team1Player1Id, id), eq(m.team1Player2Id, id),
        eq(m.team2Player1Id, id), eq(m.team2Player2Id, id),
      ),
      orderBy: [desc(matches.createdAt)],
      limit: 20,
      with: {
        team1Player1: { columns: { displayName: true } },
        team1Player2: { columns: { displayName: true } },
        team2Player1: { columns: { displayName: true } },
        team2Player2: { columns: { displayName: true } },
      },
    }),
    db.query.seasonSnapshots.findMany({
      where: eq(seasonSnapshots.playerId, id),
      with: { season: { columns: { name: true } } },
      orderBy: [desc(seasonSnapshots.createdAt)],
    }),
  ]);

  const media = Math.round(
    (player.attrAttack + player.attrDefense + player.attrVolley + player.attrConsistency + player.attrBandeja + player.attrRemate) / 6
  );

  const attrs = [
    { label: "Ataque",      value: player.attrAttack },
    { label: "Defensa",     value: player.attrDefense },
    { label: "Volea",       value: player.attrVolley },
    { label: "Consistencia",value: player.attrConsistency },
    { label: "Bandeja",     value: player.attrBandeja },
    { label: "Remate",      value: player.attrRemate },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <Link href="/admin/users" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mb-3">
          <ArrowLeft className="size-3" /> Jugadores
        </Link>
        <div className="flex items-center gap-4">
          {player.avatarUrl
            ? <img src={player.avatarUrl} alt="" className="size-14 rounded-full object-cover" />
            : <div className="size-14 rounded-full bg-violet-800 flex items-center justify-center text-2xl font-bold">{player.displayName[0]}</div>
          }
          <div>
            <h1 className="text-2xl font-bold text-white">{player.displayName}</h1>
            <p className="text-zinc-500 text-sm">@{player.username}</p>
          </div>
          <div className="ml-auto flex gap-2 items-center">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${player.role === "admin" ? "bg-violet-500/20 text-violet-400" : player.role === "moderator" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>
              {player.role}
            </span>
            {player.banned && <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">Baneado</span>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Nivel",     value: `Nv.${player.level}` },
          { label: "Media",     value: media },
          { label: "Victorias", value: player.totalWins },
          { label: "Derrotas",  value: player.totalLosses },
          { label: "MVPs",      value: player.mvpCount },
          { label: "XP",        value: player.xp.toLocaleString() },
          { label: "ELO Interno", value: player.elo },
          { label: "Registro",  value: format(new Date(player.createdAt), "dd MMM yyyy", { locale: es }) },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Attributes */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">Atributos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {attrs.map((a) => (
            <div key={a.label}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-zinc-500">{a.label}</span>
                <span className="text-xs font-mono text-zinc-300">{a.value}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${((a.value - 50) / 49) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Season history */}
      {snapshots.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-400">Historial por Temporada</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Temporada", "Pos.", "Media", "Victorias", "Derrotas"].map((h) => (
                  <th key={h} className="text-left text-xs text-zinc-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id} className="border-b border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3 text-zinc-300">{s.season?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">#{s.rankPosition}</td>
                  <td className="px-4 py-3 text-violet-400 font-mono">{Number(s.finalMediaGlobal).toFixed(0)}</td>
                  <td className="px-4 py-3 text-emerald-400">{s.totalWins}</td>
                  <td className="px-4 py-3 text-red-400">{s.totalLosses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent matches */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-400">Últimos partidos</h2>
        </div>
        {recentMatches.length === 0
          ? <p className="text-center py-8 text-zinc-600 text-sm">Sin partidos</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Pareja", "vs", "Resultado", "Fecha"].map((h) => (
                    <th key={h} className="text-left text-xs text-zinc-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentMatches.map((m) => {
                  const inTeam1 = m.team1Player1Id === id || m.team1Player2Id === id;
                  const won = (inTeam1 && m.winnerTeam === "team1") || (!inTeam1 && m.winnerTeam === "team2");
                  const myTeam = inTeam1
                    ? [m.team1Player1?.displayName, m.team1Player2?.displayName].filter(Boolean).join(" + ")
                    : [m.team2Player1?.displayName, m.team2Player2?.displayName].filter(Boolean).join(" + ");
                  const oppTeam = !inTeam1
                    ? [m.team1Player1?.displayName, m.team1Player2?.displayName].filter(Boolean).join(" + ")
                    : [m.team2Player1?.displayName, m.team2Player2?.displayName].filter(Boolean).join(" + ");
                  return (
                    <tr key={m.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-4 py-3 text-zinc-300 text-xs">{myTeam}</td>
                      <td className="px-4 py-3 text-zinc-300 text-xs">{oppTeam}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${won ? "text-emerald-400" : "text-red-400"}`}>
                          {won ? "Victoria" : "Derrota"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {format(new Date(m.createdAt), "dd MMM yyyy", { locale: es })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}
