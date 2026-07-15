import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool = databaseUrl
  ? (globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({ connectionString: databaseUrl }))
  : null;

if (pool && process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

// Export a proxy or placeholder db to avoid throwing at import time during builds
export const db = pool ? drizzle(pool) : new Proxy({} as any, {
  get(target, prop) {
    if (prop === "then") return undefined;
    throw new Error("DATABASE_URL environment variable is required at runtime.");
  }
});

