import { pool } from "./config/db";

// ─── Default password for all seed accounts: Admin@2026! ───────────────────
// Hash generated with bcrypt rounds=10
const HASH = "$2b$10$HtFBBG.7iEQvJUR4ygReQ.Y/MbcasJGbDD0OxLeYyA.wYvXDsgCY6";

const seed = async () => {
  try {
    console.log("Resetting database...");

    await pool.query(`
      DROP TABLE IF EXISTS otps               CASCADE;
      DROP TABLE IF EXISTS notifications      CASCADE;
      DROP TABLE IF EXISTS leaves             CASCADE;
      DROP TABLE IF EXISTS leave_balances     CASCADE;
      DROP TABLE IF EXISTS leave_policy_rules CASCADE;
      DROP TABLE IF EXISTS invitations        CASCADE;
      DROP TABLE IF EXISTS leave_types        CASCADE;
      DROP TABLE IF EXISTS leave_policies     CASCADE;
      DROP TABLE IF EXISTS holidays           CASCADE;
      DROP TABLE IF EXISTS users              CASCADE;
      DROP TYPE  IF EXISTS leave_status       CASCADE;
      DROP TYPE  IF EXISTS user_role          CASCADE;
    `);

    console.log("Creating schema...");

    await pool.query(`
      CREATE TYPE user_role    AS ENUM ('employee', 'manager', 'admin');
      CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
    `);

    await pool.query(`
      CREATE TABLE users (
        id             SERIAL PRIMARY KEY,
        name           VARCHAR(100)  NOT NULL,
        email          VARCHAR(150)  UNIQUE NOT NULL,
        password       TEXT          NOT NULL,
        role           user_role     DEFAULT 'employee',
        manager_id     INT,
        department     VARCHAR(100),
        policy_id      INT,
        email_verified BOOLEAN       DEFAULT true,
        created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE leave_types (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(50) NOT NULL,
        description TEXT
      );

      CREATE TABLE leave_policies (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE leave_policy_rules (
        id              SERIAL PRIMARY KEY,
        policy_id       INT REFERENCES leave_policies(id) ON DELETE CASCADE,
        leave_type_id   INT REFERENCES leave_types(id)   ON DELETE CASCADE,
        total_allocated INT NOT NULL,
        UNIQUE(policy_id, leave_type_id)
      );

      CREATE TABLE leave_balances (
        id              SERIAL PRIMARY KEY,
        user_id         INT REFERENCES users(id)       ON DELETE CASCADE,
        leave_type_id   INT REFERENCES leave_types(id) ON DELETE CASCADE,
        total_allocated NUMERIC DEFAULT 0,
        used            NUMERIC DEFAULT 0,
        UNIQUE(user_id, leave_type_id)
      );

      CREATE TABLE invitations (
        id           SERIAL PRIMARY KEY,
        name         VARCHAR(100),
        email        VARCHAR(150) NOT NULL,
        role         user_role    DEFAULT 'employee',
        department   VARCHAR(100),
        manager_id   INT REFERENCES users(id) ON DELETE SET NULL,
        policy_id    INT REFERENCES leave_policies(id) ON DELETE SET NULL,
        token        VARCHAR(255) UNIQUE NOT NULL,
        status       VARCHAR(20)  DEFAULT 'pending',
        expires_at   TIMESTAMP    NOT NULL,
        invited_by   INT REFERENCES users(id) ON DELETE SET NULL,
        created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        accepted_at  TIMESTAMP,
        leave_allocations JSONB
      );

      CREATE TABLE leaves (
        id               SERIAL PRIMARY KEY,
        user_id          INT REFERENCES users(id) ON DELETE CASCADE,
        leave_type_id    INT REFERENCES leave_types(id),
        from_date        DATE,
        to_date          DATE,
        total_days       NUMERIC,
        reason           TEXT,
        status           leave_status DEFAULT 'pending',
        applied_to       INT,
        approved_by      INT,
        duration_type    VARCHAR(20)  DEFAULT 'full',
        rejection_reason TEXT,
        approved_at      TIMESTAMPTZ,
        created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE holidays (
        id   SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        date DATE         NOT NULL
      );

      CREATE TABLE notifications (
        id         SERIAL PRIMARY KEY,
        user_id    INT REFERENCES users(id),
        message    TEXT,
        is_read    BOOLEAN   DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE otps (
        id         SERIAL PRIMARY KEY,
        user_id    INT REFERENCES users(id) ON DELETE CASCADE,
        code       VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP  NOT NULL,
        used       BOOLEAN    DEFAULT false,
        created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── FK constraints ────────────────────────────────────────────────────────
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT fk_users_manager  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE users ADD CONSTRAINT fk_users_policy   FOREIGN KEY (policy_id)  REFERENCES leave_policies(id) ON DELETE SET NULL;
      ALTER TABLE leaves ADD CONSTRAINT fk_leaves_applied_to   FOREIGN KEY (applied_to)  REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE leaves ADD CONSTRAINT fk_leaves_approved_by  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
    `);

    // ── Leave Types ───────────────────────────────────────────────────────────
    console.log("Seeding leave types...");
    await pool.query(`
      INSERT INTO leave_types (id, name, description) VALUES
      (1, 'Casual Leave',    'For personal errands and unplanned day-to-day absences'),
      (2, 'Sick Leave',      'For medical appointments, illness and health recovery'),
      (3, 'Earned Leave',    'Annual leave accrued through continuous service'),
      (4, 'Floater Leave',   'Flexible leave redeemable for festivals or personal occasions'),
      (5, 'Maternity Leave', 'Paid leave for childbirth and newborn care'),
      (6, 'Paternity Leave', 'Paid leave for new fathers after childbirth');
    `);

    // ── Leave Policies ────────────────────────────────────────────────────────
    console.log("Seeding leave policies...");
    await pool.query(`
      INSERT INTO leave_policies (id, name, description) VALUES
      (1, 'Standard',  'Default policy for all confirmed permanent employees'),
      (2, 'Senior',    'Enhanced leave entitlements for senior and tenured employees'),
      (3, 'Probation', 'Restricted leave policy for employees in the probation period');
    `);

    await pool.query(`
      INSERT INTO leave_policy_rules (policy_id, leave_type_id, total_allocated) VALUES
      -- Standard: Casual, Sick, Earned, Floater
      (1, 1, 12), (1, 2, 10), (1, 3, 15), (1, 4,  2),
      -- Senior:   Casual, Sick, Earned, Floater
      (2, 1, 15), (2, 2, 12), (2, 3, 20), (2, 4,  3),
      -- Probation: Casual, Sick, Earned, Floater
      (3, 1,  6), (3, 2,  5), (3, 3,  0), (3, 4,  1);
    `);

    // ── Users ─────────────────────────────────────────────────────────────────
    // IDs inserted without manager_id / policy_id first, then updated
    // because of self-referencing FK on users.manager_id
    console.log("Seeding users...");
    await pool.query(`
      INSERT INTO users (id, name, email, password, role, department, email_verified) VALUES
      (1, 'Navajit Singh',  'admin@leavems.com',          '${HASH}', 'admin',    NULL,          true),
      (2, 'Priya Sharma',   'priya.sharma@leavems.com',   '${HASH}', 'manager',  'Engineering', true),
      (3, 'Rahul Verma',    'rahul.verma@leavems.com',    '${HASH}', 'manager',  'Products',    true),
      (4, 'Alice Johnson',  'alice.johnson@leavems.com',  '${HASH}', 'employee', 'Engineering', true),
      (5, 'Bob Smith',      'bob.smith@leavems.com',      '${HASH}', 'employee', 'Engineering', true),
      (6, 'Charlie Davis',  'charlie.davis@leavems.com',  '${HASH}', 'employee', 'Products',    true),
      (7, 'Diana Prince',   'diana.prince@leavems.com',   '${HASH}', 'employee', 'Products',    true),
      (8, 'Eve Wilson',     'eve.wilson@leavems.com',     '${HASH}', 'employee', 'Engineering', true),
      (9, 'Frank Miller',   'frank.miller@leavems.com',   '${HASH}', 'employee', 'Products',    true);
    `);

    await pool.query(`
      UPDATE users SET manager_id = 1, policy_id = 2 WHERE id = 2;
      UPDATE users SET manager_id = 1, policy_id = 2 WHERE id = 3;
      UPDATE users SET manager_id = 2, policy_id = 1 WHERE id = 4;
      UPDATE users SET manager_id = 2, policy_id = 1 WHERE id = 5;
      UPDATE users SET manager_id = 3, policy_id = 1 WHERE id = 6;
      UPDATE users SET manager_id = 3, policy_id = 1 WHERE id = 7;
      UPDATE users SET manager_id = 2, policy_id = 3 WHERE id = 8;
      UPDATE users SET manager_id = 3, policy_id = 3 WHERE id = 9;
    `);

    // ── Leave Balances (from policy rules) ────────────────────────────────────
    console.log("Seeding leave balances...");
    await pool.query(`
      INSERT INTO leave_balances (user_id, leave_type_id, total_allocated, used)
      SELECT u.id, r.leave_type_id, r.total_allocated, 0
      FROM users u
      JOIN leave_policy_rules r ON r.policy_id = u.policy_id
      WHERE u.policy_id IS NOT NULL;
    `);

    // ── Leaves ────────────────────────────────────────────────────────────────
    console.log("Seeding leaves...");
    await pool.query(`
      INSERT INTO leaves (user_id, leave_type_id, from_date, to_date, total_days, reason, status, applied_to, approved_by, approved_at, rejection_reason, duration_type, created_at) VALUES
      -- Bob: Sick Leave approved (Engineering / Priya)
      (5, 2, '2026-03-10', '2026-03-11', 2, 'Viral fever and doctor-advised rest',     'approved', 2, 2, '2026-03-09 10:15:00', NULL,                            'full', '2026-03-08 09:00:00'),
      -- Alice: Casual Leave approved
      (4, 1, '2026-03-24', '2026-03-24', 1, 'Personal errand at government office',    'approved', 2, 2, '2026-03-23 11:30:00', NULL,                            'full', '2026-03-21 14:00:00'),
      -- Charlie: Earned Leave rejected (Products / Rahul)
      (6, 3, '2026-04-07', '2026-04-09', 3, 'Family vacation',                         'rejected', 3, 3, '2026-04-04 09:00:00', 'Critical sprint — please reschedule', 'full', '2026-04-03 16:00:00'),
      -- Diana: Casual Leave pending
      (7, 1, '2026-04-28', '2026-04-28', 1, 'Attending cousin wedding',                'pending',  3, NULL, NULL,               NULL,                            'full', '2026-04-20 10:00:00'),
      -- Priya: Earned Leave approved (by admin)
      (2, 3, '2026-05-05', '2026-05-09', 5, 'Annual family trip',                      'approved', 1, 1, '2026-04-28 09:30:00', NULL,                            'full', '2026-04-25 11:00:00'),
      -- Alice: Sick Leave pending
      (4, 2, '2026-04-29', '2026-04-29', 1, 'Dental procedure recovery',               'pending',  2, NULL, NULL,               NULL,                            'full', '2026-04-21 08:30:00'),
      -- Bob: Floater Leave approved
      (5, 4, '2026-04-14', '2026-04-14', 1, 'Tamil New Year celebration',              'approved', 2, 2, '2026-04-12 10:00:00', NULL,                            'full', '2026-04-11 09:00:00'),
      -- Frank: Casual Leave approved (probation)
      (9, 1, '2026-04-02', '2026-04-02', 1, 'Personal work',                           'approved', 3, 3, '2026-04-01 10:00:00', NULL,                            'full', '2026-03-31 15:00:00');
    `);

    // ── Update used counts from approved leaves ────────────────────────────────
    await pool.query(`
      UPDATE leave_balances lb
      SET used = sub.total
      FROM (
        SELECT user_id, leave_type_id, SUM(total_days) AS total
        FROM leaves
        WHERE status = 'approved'
        GROUP BY user_id, leave_type_id
      ) sub
      WHERE lb.user_id = sub.user_id
        AND lb.leave_type_id = sub.leave_type_id;
    `);

    // ── Holidays 2026 ─────────────────────────────────────────────────────────
    console.log("Seeding holidays...");
    await pool.query(`
      INSERT INTO holidays (date, name) VALUES
      ('2026-01-01', 'New Year''s Day'),
      ('2026-01-14', 'Pongal'),
      ('2026-01-15', 'Makar Sankranti'),
      ('2026-01-26', 'Republic Day'),
      ('2026-02-14', 'Maha Shivaratri'),
      ('2026-03-02', 'Holi'),
      ('2026-03-20', 'Eid al-Fitr (Ramzan)'),
      ('2026-04-03', 'Good Friday'),
      ('2026-04-14', 'Tamil New Year'),
      ('2026-04-14', 'Dr. Ambedkar Jayanti'),
      ('2026-05-01', 'International Labour Day'),
      ('2026-06-28', 'Eid al-Adha (Bakrid)'),
      ('2026-08-15', 'Independence Day'),
      ('2026-08-27', 'Krishna Janmashtami'),
      ('2026-09-17', 'Ganesh Chaturthi'),
      ('2026-10-02', 'Gandhi Jayanti'),
      ('2026-10-20', 'Dussehra'),
      ('2026-11-01', 'Kannada Rajyotsava'),
      ('2026-11-08', 'Diwali'),
      ('2026-12-25', 'Christmas Day');
    `);

    // ── Notifications ─────────────────────────────────────────────────────────
    console.log("Seeding notifications...");
    await pool.query(`
      INSERT INTO notifications (user_id, message, is_read, created_at) VALUES
      (2, 'Bob Smith has applied for Sick Leave on Mar 10–11.',        true,  '2026-03-08 09:05:00'),
      (2, 'Alice Johnson has applied for Casual Leave on Mar 24.',     true,  '2026-03-21 14:05:00'),
      (3, 'Charlie Davis has applied for Earned Leave on Apr 7–9.',    true,  '2026-04-03 16:05:00'),
      (3, 'Diana Prince has applied for Casual Leave on Apr 28.',      false, '2026-04-20 10:05:00'),
      (1, 'Priya Sharma has applied for Earned Leave on May 5–9.',     true,  '2026-04-25 11:05:00'),
      (2, 'Alice Johnson has applied for Sick Leave on Apr 29.',       false, '2026-04-21 08:35:00'),
      (5, 'Your Sick Leave request for Mar 10–11 has been approved.',  true,  '2026-03-09 10:20:00'),
      (4, 'Your Casual Leave request for Mar 24 has been approved.',   true,  '2026-03-23 11:35:00'),
      (6, 'Your Earned Leave request for Apr 7–9 has been rejected.',  true,  '2026-04-04 09:05:00'),
      (2, 'Your Earned Leave request for May 5–9 has been approved.',  true,  '2026-04-28 09:35:00');
    `);

    // ── Fix sequences ─────────────────────────────────────────────────────────
    console.log("Fixing sequences...");
    await pool.query(`
      SELECT setval('users_id_seq',              (SELECT MAX(id) FROM users));
      SELECT setval('leave_types_id_seq',        (SELECT MAX(id) FROM leave_types));
      SELECT setval('leave_policies_id_seq',     (SELECT MAX(id) FROM leave_policies));
      SELECT setval('leave_policy_rules_id_seq', (SELECT MAX(id) FROM leave_policy_rules));
      SELECT setval('leave_balances_id_seq',     (SELECT MAX(id) FROM leave_balances));
      SELECT setval('leaves_id_seq',             (SELECT MAX(id) FROM leaves));
      SELECT setval('holidays_id_seq',           (SELECT MAX(id) FROM holidays));
      SELECT setval('notifications_id_seq',      (SELECT MAX(id) FROM notifications));
    `);

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Database seeded successfully!

  All accounts use password: Admin@2026!

  ADMIN
    admin@leavems.com         (admin)

  MANAGERS
    priya.sharma@leavems.com  (Engineering)
    rahul.verma@leavems.com   (Products)

  EMPLOYEES
    alice.johnson@leavems.com (Engineering)
    bob.smith@leavems.com     (Engineering)
    charlie.davis@leavems.com (Products)
    diana.prince@leavems.com  (Products)
    eve.wilson@leavems.com    (Engineering / Probation)
    frank.miller@leavems.com  (Products / Probation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

seed();
