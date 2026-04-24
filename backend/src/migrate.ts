import { pool } from "./config/db";

const migrate = async () => {
    try {
        console.log("Running migrations...");

        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;`);
        await pool.query(`UPDATE users SET email_verified = true WHERE email_verified = false;`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS invitations (
                id SERIAL PRIMARY KEY,
                email VARCHAR(150) NOT NULL,
                role user_role DEFAULT 'employee',
                department VARCHAR(100),
                manager_id INT REFERENCES users(id) ON DELETE SET NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                expires_at TIMESTAMP NOT NULL,
                invited_by INT REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accepted_at TIMESTAMP
            );
        `);

        await pool.query(`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS name VARCHAR(100);`);
        await pool.query(`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS leave_allocations JSONB;`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS leave_policies (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS leave_policy_rules (
                id SERIAL PRIMARY KEY,
                policy_id INT REFERENCES leave_policies(id) ON DELETE CASCADE,
                leave_type_id INT REFERENCES leave_types(id) ON DELETE CASCADE,
                total_allocated INT NOT NULL,
                UNIQUE(policy_id, leave_type_id)
            );
        `);

        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS policy_id INT REFERENCES leave_policies(id) ON DELETE SET NULL;`);
        await pool.query(`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS policy_id INT REFERENCES leave_policies(id) ON DELETE SET NULL;`);
        await pool.query(`ALTER TABLE leave_types DROP COLUMN IF EXISTS max_days;`);
        await pool.query(`
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'leave_balances_user_type_unique'
        ) THEN
            ALTER TABLE leave_balances ADD CONSTRAINT leave_balances_user_type_unique UNIQUE (user_id, leave_type_id);
        END IF;
    END $$;
`);


        // Add is_unlimited to leave_types
        await pool.query(`ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false;`);

        // Add is_unlimited column if missing, default existing rows to false
        await pool.query(`UPDATE leave_types SET is_unlimited = false WHERE is_unlimited IS NULL;`);

        // Fix names and descriptions for all standard types
        await pool.query(`
            UPDATE leave_types SET
                name        = 'Casual Leave',
                description = 'For personal errands and unplanned day-to-day absences',
                is_unlimited = false
            WHERE id = 1;

            UPDATE leave_types SET
                name        = 'Sick Leave',
                description = 'For medical appointments, illness and health recovery',
                is_unlimited = false
            WHERE id = 2;

            UPDATE leave_types SET
                name        = 'Earned Leave',
                description = 'Annual leave accrued through continuous service',
                is_unlimited = false
            WHERE id = 3;

            UPDATE leave_types SET
                name        = 'Floater Leave',
                description = 'Flexible leave redeemable for festivals or personal occasions',
                is_unlimited = false
            WHERE id = 4;
        `);

        // Fix Maternity/Paternity — they may be on ids 8/9 instead of 5/6
        await pool.query(`
            UPDATE leave_types SET
                name        = 'Maternity Leave',
                description = 'Paid leave for childbirth and newborn care',
                is_unlimited = false
            WHERE name ILIKE '%matern%';

            UPDATE leave_types SET
                name        = 'Paternity Leave',
                description = 'Paid leave for new fathers after childbirth',
                is_unlimited = false
            WHERE name ILIKE '%patern%';
        `);

        // Remove duplicate LOP (type 10) — migrate any references to type 7 first
        await pool.query(`UPDATE leaves SET leave_type_id = 7 WHERE leave_type_id = 10;`);
        await pool.query(`UPDATE leave_policy_rules SET leave_type_id = 7 WHERE leave_type_id = 10;`);
        // For balances: delete type 10 rows where user already has type 7, then update the rest
        await pool.query(`DELETE FROM leave_balances WHERE leave_type_id = 10 AND user_id IN (SELECT user_id FROM leave_balances WHERE leave_type_id = 7);`);
        await pool.query(`UPDATE leave_balances SET leave_type_id = 7 WHERE leave_type_id = 10;`);
        await pool.query(`DELETE FROM leave_types WHERE id = 10;`);

        // Ensure type 7 is correct LOP
        await pool.query(`
            INSERT INTO leave_types (id, name, description, is_unlimited)
            VALUES (7, 'Loss Of Pay', 'Unpaid leave deducted from salary. No balance limit.', true)
            ON CONFLICT (id) DO UPDATE
                SET name = 'Loss Of Pay',
                    description = 'Unpaid leave deducted from salary. No balance limit.',
                    is_unlimited = true;
        `);

        // Give every existing user an LOP balance row if they don't have one
        await pool.query(`
            INSERT INTO leave_balances (user_id, leave_type_id, total_allocated, used)
            SELECT id, 7, 0, 0 FROM users
            ON CONFLICT (user_id, leave_type_id) DO NOTHING;
        `);

        console.log("Migrations complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};
migrate();
