"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@libsql/client");
require("dotenv/config");
const libsql_1 = require("drizzle-orm/libsql");
const client = (0, client_1.createClient)({
    url: `${process.env.DATABASE_URL}`,
    authToken: process.env.DATABASE_AUTH_TOKEN,
});
exports.db = (0, libsql_1.drizzle)(client);
