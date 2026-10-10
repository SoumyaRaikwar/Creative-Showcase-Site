import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

/** True when DATABASE_URL is set. The API stores contact messages only then. */
export const isDbConfigured = Boolean(connectionString);

let cached: NodePgDatabase<typeof schema> | null = null;

/**
 * Lazily create the Drizzle client. Throws if DATABASE_URL is missing, so
 * callers should check `isDbConfigured` first.
 */
export function getDb(): NodePgDatabase<typeof schema> {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!cached) {
    const pool = new Pool({ connectionString });
    cached = drizzle(pool, { schema });
  }
  return cached;
}

export * from "./schema";
