import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env with precedence over machine-level env vars (see server/load-env.ts)
config({ override: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
