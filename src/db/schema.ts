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
  uniquePair:   uniqueIndex("friendships_pair_idx").on(t.requesterId, t.addresseeId),
  requesterIdx: index("friendships_requester_idx").on(t.requesterId),
  addresseeIdx: index("friendships_addressee_idx").on(t.addresseeId),
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
  notifications:     many(notifications, { relationName: "target" }),
  sentNotifications: many(notifications, { relationName: "fromPlayer" }),
  reactions:         many(matchReactions),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  season:       one(seasons, { fields: [matches.seasonId], references: [seasons.id] }),
  team1Player1: one(players, { fields: [matches.team1Player1Id], references: [players.id] }),
  team1Player2: one(players, { fields: [matches.team1Player2Id], references: [players.id] }),
  team2Player1: one(players, { fields: [matches.team2Player1Id], references: [players.id] }),
  team2Player2: one(players, { fields: [matches.team2Player2Id], references: [players.id] }),
  reactions:    many(matchReactions),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  player: one(players, { fields: [achievements.playerId], references: [players.id] }),
  season: one(seasons, { fields: [achievements.seasonId], references: [seasons.id] }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(players, { fields: [friendships.requesterId], references: [players.id], relationName: "requester" }),
  addressee: one(players, { fields: [friendships.addresseeId], references: [players.id], relationName: "addressee" }),
}));

// ── Types inferidos ────────────────────────────────────────────────────────

export type Player       = typeof players.$inferSelect;
export type NewPlayer    = typeof players.$inferInsert;
export type Match        = typeof matches.$inferSelect;
export type NewMatch     = typeof matches.$inferInsert;
export type Season       = typeof seasons.$inferSelect;
export type Achievement  = typeof achievements.$inferSelect;
export type Friendship   = typeof friendships.$inferSelect;

// ── Match Reactions ────────────────────────────────────────────────────────

export const matchReactions = pgTable("match_reactions", {
  id:        uuid("id").primaryKey().defaultRandom(),
  matchId:   uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  playerId:  uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  emoji:     text("emoji").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueReaction: uniqueIndex("match_reactions_unique_idx").on(t.matchId, t.playerId, t.emoji),
  matchIdx:       index("match_reactions_match_idx").on(t.matchId),
}));

// ── Notifications ──────────────────────────────────────────────────────────

export type NotificationType = 
  | "friend_request" | "friend_accepted" | "match_reaction"
  | "match_registered" | "level_up" | "achievement";

export const notifications = pgTable("notifications", {
  id:           uuid("id").primaryKey().defaultRandom(),
  playerId:     uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  type:         text("type").notNull().$type<NotificationType>(),
  fromPlayerId: uuid("from_player_id").references(() => players.id, { onDelete: "set null" }),
  matchId:      uuid("match_id").references(() => matches.id, { onDelete: "set null" }),
  message:      text("message").notNull(),
  read:         boolean("read").notNull().default(false),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  playerIdx: index("notifications_player_idx").on(t.playerId, t.read),
}));

// ── New Relations ──────────────────────────────────────────────────────────

export const matchReactionsRelations = relations(matchReactions, ({ one }) => ({
  match:  one(matches,  { fields: [matchReactions.matchId],  references: [matches.id] }),
  player: one(players,  { fields: [matchReactions.playerId], references: [players.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  player:     one(players, { fields: [notifications.playerId],     references: [players.id], relationName: "target" }),
  fromPlayer: one(players, { fields: [notifications.fromPlayerId], references: [players.id], relationName: "fromPlayer" }),
  match:      one(matches,  { fields: [notifications.matchId],      references: [matches.id] }),
}));

// Tipos inferidos nuevos
export type MatchReaction  = typeof matchReactions.$inferSelect;
export type Notification   = typeof notifications.$inferSelect;

// ── Enums nuevos (Fase 6) ───────────────────────────────────────────────────

export const tournamentFormatEnum = pgEnum("tournament_format", ["elimination", "round_robin"]);
export const tournamentStatusEnum = pgEnum("tournament_status", ["open", "in_progress", "finished"]);
export const challengeStatusEnum  = pgEnum("challenge_status",  ["pending", "accepted", "rejected", "completed"]);

// ── Tournaments ────────────────────────────────────────────────────────────

export const tournaments = pgTable("tournaments", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull(),
  description: text("description"),
  format:      tournamentFormatEnum("format").notNull().default("elimination"),
  status:      tournamentStatusEnum("status").notNull().default("open"),
  maxTeams:    integer("max_teams").notNull().default(8),
  xpReward:    integer("xp_reward").notNull().default(500),
  createdBy:   uuid("created_by").notNull().references(() => players.id),
  seasonId:    uuid("season_id").references(() => seasons.id),
  startsAt:    timestamp("starts_at", { withTimezone: true }),
  finishedAt:  timestamp("finished_at", { withTimezone: true }),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tournamentTeams = pgTable("tournament_teams", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  player1Id:    uuid("player1_id").notNull().references(() => players.id),
  player2Id:    uuid("player2_id").notNull().references(() => players.id),
  name:         text("name"),
  seed:         integer("seed"),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tournamentRounds = pgTable("tournament_rounds", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  roundNumber:  integer("round_number").notNull(),
  name:         text("name").notNull(),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tournamentMatches = pgTable("tournament_matches", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  roundId:      uuid("round_id").notNull().references(() => tournamentRounds.id, { onDelete: "cascade" }),
  team1Id:      uuid("team1_id").references(() => tournamentTeams.id),
  team2Id:      uuid("team2_id").references(() => tournamentTeams.id),
  winnerId:     uuid("winner_id").references(() => tournamentTeams.id),
  sets:         jsonb("sets").$type<Array<{ team1: number; team2: number }>>(),
  scheduledAt:  timestamp("scheduled_at", { withTimezone: true }),
  playedAt:     timestamp("played_at", { withTimezone: true }),
  position:     integer("position").notNull().default(0),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Leagues ────────────────────────────────────────────────────────────────

export const leagues = pgTable("leagues", {
  id:           uuid("id").primaryKey().defaultRandom(),
  name:         text("name").notNull(),
  description:  text("description"),
  status:       tournamentStatusEnum("status").notNull().default("open"),
  totalRounds:  integer("total_rounds").notNull().default(8),
  xpPerWin:     integer("xp_per_win").notNull().default(150),
  createdBy:    uuid("created_by").notNull().references(() => players.id),
  seasonId:     uuid("season_id").references(() => seasons.id),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leagueTeams = pgTable("league_teams", {
  id:        uuid("id").primaryKey().defaultRandom(),
  leagueId:  uuid("league_id").notNull().references(() => leagues.id, { onDelete: "cascade" }),
  player1Id: uuid("player1_id").notNull().references(() => players.id),
  player2Id: uuid("player2_id").notNull().references(() => players.id),
  name:      text("name"),
  points:    integer("points").notNull().default(0),
  wins:      integer("wins").notNull().default(0),
  losses:    integer("losses").notNull().default(0),
  setsWon:   integer("sets_won").notNull().default(0),
  setsLost:  integer("sets_lost").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leagueRounds = pgTable("league_rounds", {
  id:          uuid("id").primaryKey().defaultRandom(),
  leagueId:    uuid("league_id").notNull().references(() => leagues.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  startsAt:    timestamp("starts_at", { withTimezone: true }),
  endsAt:      timestamp("ends_at", { withTimezone: true }),
  completed:   boolean("completed").notNull().default(false),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leagueMatches = pgTable("league_matches", {
  id:        uuid("id").primaryKey().defaultRandom(),
  leagueId:  uuid("league_id").notNull().references(() => leagues.id, { onDelete: "cascade" }),
  roundId:   uuid("round_id").notNull().references(() => leagueRounds.id, { onDelete: "cascade" }),
  team1Id:   uuid("team1_id").notNull().references(() => leagueTeams.id),
  team2Id:   uuid("team2_id").notNull().references(() => leagueTeams.id),
  winnerId:  uuid("winner_id").references(() => leagueTeams.id),
  sets:      jsonb("sets").$type<Array<{ team1: number; team2: number }>>(),
  playedAt:  timestamp("played_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Challenges ─────────────────────────────────────────────────────────────

export const challenges = pgTable("challenges", {
  id:           uuid("id").primaryKey().defaultRandom(),
  challengerId: uuid("challenger_id").notNull().references(() => players.id),
  challengedId: uuid("challenged_id").notNull().references(() => players.id),
  xpStake:      integer("xp_stake").notNull().default(100),
  status:       challengeStatusEnum("status").notNull().default("pending"),
  matchId:      uuid("match_id").references(() => matches.id),
  message:      text("message"),
  expiresAt:    timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Fase 6 Relations ────────────────────────────────────────────────────────

export const tournamentsRelations = relations(tournaments, ({ many, one }) => ({
  teams:     many(tournamentTeams),
  rounds:    many(tournamentRounds),
  creator:   one(players, { fields: [tournaments.createdBy], references: [players.id] }),
  season:    one(seasons, { fields: [tournaments.seasonId], references: [seasons.id] }),
}));

export const tournamentTeamsRelations = relations(tournamentTeams, ({ one }) => ({
  tournament: one(tournaments, { fields: [tournamentTeams.tournamentId], references: [tournaments.id] }),
  player1:    one(players,     { fields: [tournamentTeams.player1Id],    references: [players.id] }),
  player2:    one(players,     { fields: [tournamentTeams.player2Id],    references: [players.id] }),
}));

export const tournamentRoundsRelations = relations(tournamentRounds, ({ one, many }) => ({
  tournament: one(tournaments, { fields: [tournamentRounds.tournamentId], references: [tournaments.id] }),
  matches:    many(tournamentMatches),
}));

export const tournamentMatchesRelations = relations(tournamentMatches, ({ one }) => ({
  tournament: one(tournaments,      { fields: [tournamentMatches.tournamentId], references: [tournaments.id] }),
  round:      one(tournamentRounds, { fields: [tournamentMatches.roundId],      references: [tournamentRounds.id] }),
  team1:      one(tournamentTeams,  { fields: [tournamentMatches.team1Id],      references: [tournamentTeams.id] }),
  team2:      one(tournamentTeams,  { fields: [tournamentMatches.team2Id],      references: [tournamentTeams.id] }),
  winner:     one(tournamentTeams,  { fields: [tournamentMatches.winnerId],     references: [tournamentTeams.id] }),
}));

export const leaguesRelations = relations(leagues, ({ many, one }) => ({
  teams:   many(leagueTeams),
  rounds:  many(leagueRounds),
  creator: one(players, { fields: [leagues.createdBy], references: [players.id] }),
  season:  one(seasons, { fields: [leagues.seasonId],  references: [seasons.id] }),
}));

export const leagueTeamsRelations = relations(leagueTeams, ({ one }) => ({
  league:  one(leagues, { fields: [leagueTeams.leagueId], references: [leagues.id] }),
  player1: one(players, { fields: [leagueTeams.player1Id], references: [players.id] }),
  player2: one(players, { fields: [leagueTeams.player2Id], references: [players.id] }),
}));

export const leagueRoundsRelations = relations(leagueRounds, ({ one, many }) => ({
  league:  one(leagues, { fields: [leagueRounds.leagueId], references: [leagues.id] }),
  matches: many(leagueMatches),
}));

export const leagueMatchesRelations = relations(leagueMatches, ({ one }) => ({
  league:  one(leagues,      { fields: [leagueMatches.leagueId],  references: [leagues.id] }),
  round:   one(leagueRounds, { fields: [leagueMatches.roundId],   references: [leagueRounds.id] }),
  team1:   one(leagueTeams,  { fields: [leagueMatches.team1Id],   references: [leagueTeams.id] }),
  team2:   one(leagueTeams,  { fields: [leagueMatches.team2Id],   references: [leagueTeams.id] }),
  winner:  one(leagueTeams,  { fields: [leagueMatches.winnerId],  references: [leagueTeams.id] }),
}));

export const challengesRelations = relations(challenges, ({ one }) => ({
  challenger: one(players, { fields: [challenges.challengerId], references: [players.id] }),
  challenged: one(players, { fields: [challenges.challengedId], references: [players.id] }),
  match:      one(matches, { fields: [challenges.matchId],      references: [matches.id] }),
}));

// ── ELO History ────────────────────────────────────────────────────────────

export const eloHistory = pgTable("elo_history", {
  id:         uuid("id").primaryKey().defaultRandom(),
  playerId:   uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  elo:        integer("elo").notNull(),
  delta:      integer("delta").notNull().default(0),
  matchId:    uuid("match_id").references(() => matches.id, { onDelete: "set null" }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  playerIdx: index("elo_history_player_idx").on(t.playerId, t.recordedAt),
}));

export const eloHistoryRelations = relations(eloHistory, ({ one }) => ({
  player: one(players, { fields: [eloHistory.playerId], references: [players.id] }),
  match:  one(matches,  { fields: [eloHistory.matchId],  references: [matches.id] }),
}));

export type EloHistory = typeof eloHistory.$inferSelect;

// ── Tournament Invitations ─────────────────────────────────────────────────

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending", "accepted", "rejected"
]);

export const tournamentInvitations = pgTable("tournament_invitations", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tournamentId:     uuid("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  inviterId:        uuid("inviter_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  inviteeId:        uuid("invitee_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  status:           invitationStatusEnum("status").notNull().default("pending"),
  tournamentTeamId: uuid("tournament_team_id").references(() => tournamentTeams.id, { onDelete: "set null" }),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueInvitation: uniqueIndex("tournament_invitations_unique_idx").on(t.tournamentId, t.inviteeId),
  inviteeIdx:       index("tournament_invitations_invitee_idx").on(t.inviteeId, t.status),
}));

export const tournamentInvitationsRelations = relations(tournamentInvitations, ({ one }) => ({
  tournament: one(tournaments,     { fields: [tournamentInvitations.tournamentId],     references: [tournaments.id] }),
  inviter:    one(players,         { fields: [tournamentInvitations.inviterId],         references: [players.id] }),
  invitee:    one(players,         { fields: [tournamentInvitations.inviteeId],         references: [players.id] }),
  team:       one(tournamentTeams, { fields: [tournamentInvitations.tournamentTeamId], references: [tournamentTeams.id] }),
}));

export type TournamentInvitation = typeof tournamentInvitations.$inferSelect;

// Tipos inferidos Fase 6
export type Tournament      = typeof tournaments.$inferSelect;
export type TournamentTeam  = typeof tournamentTeams.$inferSelect;
export type TournamentRound = typeof tournamentRounds.$inferSelect;
export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type League          = typeof leagues.$inferSelect;
export type LeagueTeam      = typeof leagueTeams.$inferSelect;
export type LeagueRound     = typeof leagueRounds.$inferSelect;
export type LeagueMatch     = typeof leagueMatches.$inferSelect;
export type Challenge       = typeof challenges.$inferSelect;
