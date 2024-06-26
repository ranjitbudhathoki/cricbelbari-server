import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  battingStyle: text("batting_style").notNull(),
  bowlingStyle: text("bowling_style").notNull(),
  profile: text("profile").notNull(),
  dob: text("dob", { mode: "text" }).notNull(),
});

export const battingStats = sqliteTable("batting_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").notNull().unique(),
  matches: integer("matches").notNull(),
  innings: integer("innings").notNull(),
  runs: integer("runs").notNull(),
  ballsFaced: integer("balls_faced").notNull(),
  highScore: integer("high_score").notNull(),
  outs: integer("outs").notNull(),
});

export const bowlingStats = sqliteTable("bowling_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").notNull().unique(),
  matches: integer("matches").notNull(),
  innings: integer("innings").notNull(),
  wickets: integer("wickets").notNull(),
  overs: integer("overs").notNull(),
  runsConceded: integer("runs_conceded").notNull(),
  bestBowling: text("best_bowling").notNull(),
});

// Define relations
export const playersRelations = relations(players, ({ one }) => ({
  battingStats: one(battingStats, {
    fields: [players.id],
    references: [battingStats.playerId],
  }),
  bowlingStats: one(bowlingStats, {
    fields: [players.id],
    references: [bowlingStats.playerId],
  }),
}));

export const battingStatsRelations = relations(battingStats, ({ one }) => ({
  player: one(players, {
    fields: [battingStats.playerId],
    references: [players.id],
  }),
}));

export const bowlingStatsRelations = relations(bowlingStats, ({ one }) => ({
  player: one(players, {
    fields: [bowlingStats.playerId],
    references: [players.id],
  }),
}));
