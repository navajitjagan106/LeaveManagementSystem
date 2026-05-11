import "dotenv/config";
import { pool } from "../config/db";

async function run() {
    try {
        const result = await pool.query(`
            SELECT l.id, u.name AS employee, lt.name AS leave_type, l.from_date, l.to_date, l.applied_to, m.name AS manager, l.status
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            JOIN leave_types lt ON l.leave_type_id = lt.id
            LEFT JOIN users m ON l.applied_to = m.id
            ORDER BY l.id DESC
            LIMIT 10
        `);
        console.log("LAST 10 LEAVES:");
        console.table(result.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
