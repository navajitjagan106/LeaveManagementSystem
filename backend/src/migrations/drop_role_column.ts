import "dotenv/config";
import { pool } from "../config/db";

async function run() {
    try {
        console.log("Dropping column 'role' from 'users' table...");
        await pool.query("ALTER TABLE users DROP COLUMN role;");
        console.log("Successfully dropped 'role' column from 'users' table!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

run();
