/**
 * Direct Postgres client for Drizzle Kit migrations and scripts only.
 * App runtime uses the Supabase server client (HTTPS) — see lib/supabase/server-query.ts.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
