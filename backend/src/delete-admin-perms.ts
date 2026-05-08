import "dotenv/config";
import { pool } from "./config/db";

const runPrune = async () => {
    try {
        console.log("Connecting to the database and pruning administrative page definitions...");

        const targetKeys = [
            "admin_dashboard"
        ];

        console.log("Target page keys to remove:", targetKeys);

        // 1. Delete matching records from role_permissions first to satisfy potential foreign key constraints
        const deleteRolePerms = await pool.query(
            "DELETE FROM role_permissions WHERE page_key = ANY($1) RETURNING *",
            [targetKeys]
        );
        console.log(`Pruned ${deleteRolePerms.rowCount} entries from role_permissions.`);

        // 2. Delete matching records from page_definitions
        const deletePageDefs = await pool.query(
            "DELETE FROM page_definitions WHERE key = ANY($1) RETURNING *",
            [targetKeys]
        );
        console.log(`Pruned ${deletePageDefs.rowCount} entries from page_definitions.`);

        console.log("Database pruning completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Failed to prune admin page definitions from the database:", err);
        process.exit(1);
    }
};

runPrune();
