import dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, "../../.env") });

import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";

async function runMigrations() {
  // Log the DATABASE_URL (without the auth token) for debugging
  console.log("Database URL:", process.env.DATABASE_URL);

  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const db = drizzle(client);

  console.log("Running migrations...");

  await migrate(db, { migrationsFolder: resolve(__dirname, "../../drizzle") });

  console.log("Migrations completed!");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed!", err);
  process.exit(1);
});
