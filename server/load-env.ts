// Loads .env and lets it take precedence over any pre-existing machine/user
// environment variables. `override: true` matters because a global DATABASE_URL
// (e.g. set for another project) would otherwise shadow this project's .env.
// Imported first — before any module that reads process.env — so values are set
// before db.ts / drizzle read them.
import { config } from "dotenv";

config({ override: true });
