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


        console.log("Migrations complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};
migrate();
