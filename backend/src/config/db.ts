import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

console.log("USING DB:", process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});