import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connString = process.env.DB_URL;

    if (!connString) {
      throw new Error("DB_URL environment variable is not set");
    }

    pool = new Pool({
      connectionString: connString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on("error", (err) => {
      console.error("PostgreSQL pool error:", err);
    });
  }
  
  return pool;
}