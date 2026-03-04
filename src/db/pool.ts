import { Pool } from "@neondatabase/serverless";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connString = process.env.DB_URL;

    if (!connString) {
      throw new Error("DB_URL environment variable is not set");
    }

    pool = new Pool({
      connectionString: connString
    });

    pool.on("error", (err: any) => {
      console.error("PostgreSQL pool error:", err);
    });
  }
  
  return pool;
}