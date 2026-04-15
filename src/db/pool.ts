import { Client } from "@neondatabase/serverless";

export async function query(sql: string, params: any[] = []) {
  const connString = process.env.DB_URL;

  if (!connString) {
    throw new Error("DB_URL environment variable is not set");
  }

  const client = new Client({
    connectionString: connString
  });

  try {
    await client.connect();
    const result = await client.query(sql, params);
    return result;
  } finally {
    await client.end();
  }
}

/*
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
*/
