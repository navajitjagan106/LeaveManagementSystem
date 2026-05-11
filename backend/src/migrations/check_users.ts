import "dotenv/config";
import { pool } from "../config/db";

async function run() {
    try {
        const result = await pool.query("SELECT id, name, email, manager_id FROM users ORDER BY id ASC");
        console.log("USERS IN DATABASE:");
        console.table(result.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
