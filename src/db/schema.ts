import {
  pgTable, pgEnum, uuid, text, integer,
  boolean, timestamp, jsonb, uniqueIndex, index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────────────────────

export const positionEnum = pgEnum("position", ["left", "right", "both"]);

export const winnerTeamEnum = pgEnum("winner_team", ["team1", "team2"]);

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending", "accepted"
]);

export const achievementTypeEnum = pgEnum("achievement_type", [
  "first_win", "win_streak_3", "win_streak_5", "win_streak_10",
  "top_3_ranking", "level_10", "level_25", "comeback_win",
  "volley_master", "consistent_player", "century_matches"
]);

// ── Seasons ────────────────────────────────────────────────────────────────

export const seasons = pgTable("seasons", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate:   timestamp("end_date", { withTimezone: true }),
  isActive:  boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Players ────────────────────────────────────────────────────────────────

export const players = pgTable("players", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        text("user_id").notNull().unique(),
  username:      text("username").notNull().unique(),
  displayName:   text("display_name").notNull(),
  avatarUrl:     text("avatar_url"),
  location:      text("location"),
  position:      positionEnum("position").default("right"),
  level:         integer("level").notNull().default(1),
  xp:            integer("xp").notNull().default(0),
  xpToNextLevel: integer("xp_to_next_level").notNull().default(1000),
  elo:           integer("elo").notNull().default(1500),
  winStreak:     integer("win_streak").notNull().default(0),
  totalWins:     integer("total_wins").notNull().default(0),
  totalLosses:   integer("total_losses").notNull().default(0),
  attrAttack:    integer("attr_attack").notNull().default(50),
  attrDefense:   integer("attr_defense").notNull().default(50),
  attrVolley:    integer("attr_volley").notNull().default(50),
  attrConsistency: integer("attr_consistency").notNull().default(50),
  seasonId:      uuid("season_id").references(() => seasons.id),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  usernameIdx: uniqueIndex("players_username_idx").on(t.username),
  userIdIdx:   uniqueIndex("players_user_id_idx").on(t.userId),
  eloIdx:      index("players_elo_idx").on(t.elo),
}));

// ── Matches ────────────────────────────────────────────────────────────────

export const matches = pgTable("matches", {
  id:              uuid("id").primaryKey().defaultRandom(),
  seasonId:        uuid("season_id").references(() => seasons.id),
  venue:           text("venue").notNull(),
  playedAt:        timestamp("played_at", { withTimezone: true }).notNull(),
  team1Player1Id:  uuid("team1_player1_id").notNull().references(() => players.id),
  team1Player2Id:  uuid("team1_player2_id").notNull().references(() => players.id),
  team2Player1Id:  uuid("team2_player1_id").notNull().references(() => players.id),
  team2Player2Id:  uuid("team2_player2_id").notNull().references(() => players.id),
  winnerTeam:      winnerTeamEnum("winner_team").notNull(),
  sets:            jsonb("sets").notNull().$type<Array<{ team1: number; team2: number }>>(),
  team1XpGained:   integer("team1_xp_gained").notNull().default(0),
  team2XpGained:   integer("team2_xp_gained").notNull().default(0),
  team1EloDelta:   integer("team1_elo_delta").notNull().default(0),
  team2EloDelta:   integer("team2_elo_delta").notNull().default(0),
  createdBy:       uuid("created_by").notNull().references(() => players.id),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  playedAtIdx: index("matches_played_at_idx").on(t.playedAt),
  seasonIdx:   index("matches_season_idx").on(t.seasonId),
}));

// ── Friendships ────────────────────────────────────────────────────────────

export const friendships = pgTable("friendships", {
  id:          uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id").notNull().references(() => players.id),
  addresseeId: uuid("addressee_id").notNull().references(() => players.id),
  status:      friendshipStatusEnum("status").notNull().default("pending"),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniquePair: uniqueIndex("friendships_pair_idx").on(t.requesterId, t.addresseeId),
}));

// ── Achievements ───────────────────────────────────────────────────────────

export const achievements = pgTable("achievements", {
  id:       uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id").notNull().references(() => players.id),
  type:     achievementTypeEnum("type").notNull(),
  seasonId: uuid("season_id").references(() => seasons.id),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueAch: uniqueIndex("achievements_unique_idx").on(t.playerId, t.type, t.seasonId),
}));

// ── Relations ──────────────────────────────────────────────────────────────

export const playersRelations = relations(players, ({ many, one }) => ({
  season:            one(seasons, { fields: [players.seasonId], references: [seasons.id] }),
  achievements:      many(achievements),
  sentFriendships:   many(friendships, { relationName: "requester" }),
  receivedFriendships: many(friendships, { relationName: "addressee" }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  season:       one(seasons, { fields: [matches.seasonId], references: [seasons.id] }),
  team1Player1: one(players, { fields: [matches.team1Player1Id], references: [players.id] }),
  team1Player2: one(players, { fields: [matches.team1Player2Id], references: [players.id] }),
  team2Player1: one(players, { fields: [matches.team2Player1Id], references: [players.id] }),
  team2Player2: one(players, { fields: [matches.team2Player2Id], references: [players.id] }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  player: one(players, { fields: [achievements.playerId], references: [players.id] }),
  season: one(seasons, { fields: [achievements.seasonId], references: [seasons.id] }),
}));

// ── Types inferidos ────────────────────────────────────────────────────────

export type Player       = typeof players.$inferSelect;
export type NewPlayer    = typeof players.$inferInsert;
export type Match        = typeof matches.$inferSelect;
export type NewMatch     = typeof matches.$inferInsert;
export type Season       = typeof seasons.$inferSelect;
export type Achievement  = typeof achievements.$inferSelect;
export type Friendship   = typeof friendships.$inferSelect;
