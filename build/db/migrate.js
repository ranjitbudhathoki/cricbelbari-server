"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
// Load environment variables from .env file
dotenv_1.default.config({ path: (0, path_1.resolve)(__dirname, "../../.env") });
const libsql_1 = require("drizzle-orm/libsql");
const migrator_1 = require("drizzle-orm/libsql/migrator");
const client_1 = require("@libsql/client");
function runMigrations() {
    return __awaiter(this, void 0, void 0, function* () {
        // Log the DATABASE_URL (without the auth token) for debugging
        console.log("Database URL:", process.env.DATABASE_URL);
        const client = (0, client_1.createClient)({
            url: process.env.DATABASE_URL,
            authToken: process.env.DATABASE_AUTH_TOKEN,
        });
        const db = (0, libsql_1.drizzle)(client);
        console.log("Running migrations...");
        yield (0, migrator_1.migrate)(db, { migrationsFolder: (0, path_1.resolve)(__dirname, "../../drizzle") });
        console.log("Migrations completed!");
        process.exit(0);
    });
}
runMigrations().catch((err) => {
    console.error("Migration failed!", err);
    process.exit(1);
});
