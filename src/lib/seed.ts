import { db } from "@db/index";
import { players, matches, seasons } from "@db/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  // Verificar si ya hay datos
  const existing = await db.query.players.findFirst();
  if (existing) {
    console.log("Database already seeded, skipping.");
    return;
  }

  // Obtener Season 4
  const season = await db.query.seasons.findFirst({
    where: eq(seasons.status, "active"),
  });

  // Seed players (sin user_id real — solo para demo)
  const seedPlayers = [
    { username: "sofia_r",  displayName: "Sofía Romero",  elo: 2104, level: 31, xp: 15200, winStreak: 3, totalWins: 42, totalLosses: 18, attrAttack: 88, attrDefense: 72, attrVolley: 85, attrConsistency: 90, location: "Madrid" },
    { username: "diego_t",  displayName: "Diego Torres",  elo: 1955, level: 27, xp: 12800, winStreak: 1, totalWins: 35, totalLosses: 20, attrAttack: 75, attrDefense: 80, attrVolley: 70, attrConsistency: 78, location: "Barcelona" },
    { username: "lucas_m",  displayName: "Lucas Marín",   elo: 1842, level: 24, xp: 10400, winStreak: 5, totalWins: 28, totalLosses: 14, attrAttack: 78, attrDefense: 64, attrVolley: 71, attrConsistency: 82, location: "Madrid" },
    { username: "marta_v",  displayName: "Marta Vidal",   elo: 1788, level: 22, xp: 9200,  winStreak: 2, totalWins: 24, totalLosses: 16, attrAttack: 70, attrDefense: 75, attrVolley: 68, attrConsistency: 74, location: "Valencia" },
    { username: "pablo_n",  displayName: "Pablo Núñez",   elo: 1642, level: 19, xp: 7600,  winStreak: 0, totalWins: 18, totalLosses: 22, attrAttack: 65, attrDefense: 60, attrVolley: 62, attrConsistency: 68, location: "Sevilla" },
    { username: "iker_r",   displayName: "Iker Ruiz",     elo: 1530, level: 17, xp: 6400,  winStreak: 0, totalWins: 14, totalLosses: 24, attrAttack: 60, attrDefense: 58, attrVolley: 55, attrConsistency: 62, location: "Bilbao" },
  ];

  const insertedPlayers = await db.insert(players).values(
    seedPlayers.map((p) => ({
      ...p,
      userId:        "seed_" + p.username,
      xpToNextLevel: 1000,
      seasonId:      season?.id,
    }))
  ).returning();

  // Seed matches
  const [sofia, diego, lucas, marta, pablo, iker] = insertedPlayers as typeof insertedPlayers;

  if (!sofia || !diego || !lucas || !marta || !pablo || !iker) return;

  await db.insert(matches).values([
    {
      venue:          "Club Pádel Madrid",
      playedAt:       new Date(Date.now() - 2 * 60 * 60 * 1000),
      team1Player1Id: lucas.id,
      team1Player2Id: sofia.id,
      team2Player1Id: diego.id,
      team2Player2Id: marta.id,
      winnerTeam:     "team1",
      sets:           [{ team1: 6, team2: 4 }, { team1: 7, team2: 5 }],
      team1XpGained:  145,
      team2XpGained:  60,
      team1EloDelta:  15,
      team2EloDelta:  -15,
      createdBy:      lucas.id,
      seasonId:       season?.id,
    },
    {
      venue:          "Indoor Arena",
      playedAt:       new Date(Date.now() - 24 * 60 * 60 * 1000),
      team1Player1Id: lucas.id,
      team1Player2Id: pablo.id,
      team2Player1Id: iker.id,
      team2Player2Id: diego.id,
      winnerTeam:     "team2",
      sets:           [{ team1: 3, team2: 6 }, { team1: 6, team2: 4 }, { team1: 4, team2: 6 }],
      team1XpGained:  60,
      team2XpGained:  120,
      team1EloDelta:  -12,
      team2EloDelta:  12,
      createdBy:      lucas.id,
      seasonId:       season?.id,
    },
    {
      venue:          "Padel Park",
      playedAt:       new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      team1Player1Id: sofia.id,
      team1Player2Id: diego.id,
      team2Player1Id: marta.id,
      team2Player2Id: pablo.id,
      winnerTeam:     "team1",
      sets:           [{ team1: 6, team2: 2 }, { team1: 6, team2: 3 }],
      team1XpGained:  180,
      team2XpGained:  60,
      team1EloDelta:  18,
      team2EloDelta:  -18,
      createdBy:      sofia.id,
      seasonId:       season?.id,
    },
    {
      venue:          "Sunset Courts",
      playedAt:       new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      team1Player1Id: lucas.id,
      team1Player2Id: diego.id,
      team2Player1Id: iker.id,
      team2Player2Id: marta.id,
      winnerTeam:     "team1",
      sets:           [{ team1: 7, team2: 6 }, { team1: 6, team2: 4 }],
      team1XpGained:  165,
      team2XpGained:  60,
      team1EloDelta:  16,
      team2EloDelta:  -16,
      createdBy:      lucas.id,
      seasonId:       season?.id,
    },
  ]);

  console.log("Seed completed successfully.");
}
