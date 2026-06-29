import { db } from "@db/index";
import { seasons, seasonSnapshots } from "@db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import SnapshotClient from "./SnapshotClient";

export default async function SnapshotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const season = await db.query.seasons.findFirst({
    where: eq(seasons.id, id),
  });
  if (!season) notFound();

  const snapshots = await db.query.seasonSnapshots.findMany({
    where: eq(seasonSnapshots.seasonId, id),
    with: { player: { columns: { displayName: true, avatarUrl: true, username: true } } },
    orderBy: (t, { asc }) => [asc(t.rankPosition)],
  });

  return <SnapshotClient season={season} snapshots={snapshots} />;
}
