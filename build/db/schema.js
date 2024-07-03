"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bowlingStatsRelations = exports.battingStatsRelations = exports.playersRelations = exports.bowlingStats = exports.battingStats = exports.players = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.players = (0, sqlite_core_1.sqliteTable)("players", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)("name").notNull(),
    role: (0, sqlite_core_1.text)("role").notNull(),
    battingStyle: (0, sqlite_core_1.text)("batting_style").notNull(),
    bowlingStyle: (0, sqlite_core_1.text)("bowling_style").notNull(),
    profile: (0, sqlite_core_1.text)("profile").notNull(),
    dob: (0, sqlite_core_1.text)("dob", { mode: "text" }).notNull(),
});
exports.battingStats = (0, sqlite_core_1.sqliteTable)("batting_stats", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    playerId: (0, sqlite_core_1.integer)("player_id").notNull().unique(),
    matches: (0, sqlite_core_1.integer)("matches").notNull(),
    innings: (0, sqlite_core_1.integer)("innings").notNull(),
    runs: (0, sqlite_core_1.integer)("runs").notNull(),
    ballsFaced: (0, sqlite_core_1.integer)("balls_faced").notNull(),
    highScore: (0, sqlite_core_1.integer)("high_score").notNull(),
    outs: (0, sqlite_core_1.integer)("outs").notNull(),
});
exports.bowlingStats = (0, sqlite_core_1.sqliteTable)("bowling_stats", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    playerId: (0, sqlite_core_1.integer)("player_id").notNull().unique(),
    matches: (0, sqlite_core_1.integer)("matches").notNull(),
    innings: (0, sqlite_core_1.integer)("innings").notNull(),
    wickets: (0, sqlite_core_1.integer)("wickets").notNull(),
    overs: (0, sqlite_core_1.integer)("overs").notNull(),
    runsConceded: (0, sqlite_core_1.integer)("runs_conceded").notNull(),
    bestBowling: (0, sqlite_core_1.text)("best_bowling").notNull(),
});
// Define relations
exports.playersRelations = (0, drizzle_orm_1.relations)(exports.players, ({ one }) => ({
    battingStats: one(exports.battingStats, {
        fields: [exports.players.id],
        references: [exports.battingStats.playerId],
    }),
    bowlingStats: one(exports.bowlingStats, {
        fields: [exports.players.id],
        references: [exports.bowlingStats.playerId],
    }),
}));
exports.battingStatsRelations = (0, drizzle_orm_1.relations)(exports.battingStats, ({ one }) => ({
    player: one(exports.players, {
        fields: [exports.battingStats.playerId],
        references: [exports.players.id],
    }),
}));
exports.bowlingStatsRelations = (0, drizzle_orm_1.relations)(exports.bowlingStats, ({ one }) => ({
    player: one(exports.players, {
        fields: [exports.bowlingStats.playerId],
        references: [exports.players.id],
    }),
}));
