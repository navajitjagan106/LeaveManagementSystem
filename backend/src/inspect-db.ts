import "dotenv/config";
import { pool } from "./config/db";

const inspect = async () => {
    try {
        console.log("Simulating Admin getEmployees query...");
        const result = await pool.query(`
            SELECT u.id, u.name, u.email, r.id AS role_id, u.role, m.name AS manager_name, p.name AS policy_name
            FROM users u
            JOIN roles r ON u.role = r.name
            LEFT JOIN users m ON u.manager_id = m.id
            LEFT JOIN leave_policies p ON u.policy_id = p.id
        `);
        console.table(result.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspect();
