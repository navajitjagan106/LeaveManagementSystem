import { Pool } from "pg";

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`USING DB: postgres://${url.host}${url.pathname}`);
  } catch {
    console.log("USING DB: [Redacted Connection String]");
  }
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});